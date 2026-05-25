import { Hono } from 'hono';
import { eq, fleets } from '@whiteroom/db';
import { createClient, detectProviderFromModel, injectHandover } from '@whiteroom/llm-clients';
import { calculateCostCents } from '@whiteroom/shared';
import type { AppVariables } from '../types.js';
import { workspaceFromTrialToken } from '../middleware/workspace.js';
import { runGovernanceCheck, updateAgentCounters } from '../services/governance.js';
import { generateHandover, getLatestHandover } from '../services/handover.js';
import { writeAuditEvent } from '../services/audit.js';
import { estimateTokens } from '../utils/estimate-tokens.js';

const trialProxy = new Hono<{ Variables: AppVariables }>();

trialProxy.use('/t/:trial_token/v1/*', workspaceFromTrialToken);

trialProxy.post('/t/:trial_token/v1/messages', async (c) => {
  const db = c.get('db');
  const workspace = c.get('workspace');
  const agentKey = c.req.header('X-Agent-Id') || 'default';
  const taskName = c.req.header('X-Task-Name') || undefined;
  const llmApiKey = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!llmApiKey) {
    return c.json({ type: 'error', error: { type: 'auth_error' }, message: 'Missing LLM API key' }, 401);
  }

  const body = await c.req.json();
  const requestedModel = body.model || 'claude-sonnet-4-5';
  const estimatedTokens = estimateTokens(body);

  const [fleet] = await db
    .select()
    .from(fleets)
    .where(eq(fleets.workspaceId, workspace.id))
    .limit(1);

  if (!fleet) {
    return c.json({ type: 'error', error: { type: 'server_error' }, message: 'No fleet' }, 500);
  }

  const { decision, agentId, fleetConfig } = await runGovernanceCheck({
    db,
    workspaceId: workspace.id,
    fleetId: fleet.id,
    agentKey,
    requestedModel,
    estimatedTokens,
    taskName,
  });

  c.header('X-WhiteRoom-Decision', decision.action);

  await writeAuditEvent({
    db,
    workspaceId: workspace.id,
    fleetId: fleet.id,
    agentId,
    eventType: 'routing.decision',
    payload: { action: decision.action, reason: decision.reason },
  });

  if (decision.action === 'block') {
    return c.json(
      {
        type: 'error',
        error: { type: 'rate_limit_error' },
        whiteroom: { reason: 'resting', retryAfter: decision.retryAfterSeconds },
      },
      429,
    );
  }

  if (decision.action === 'compress') {
    await generateHandover({
      db,
      fleetId: fleet.id,
      agentId,
      workspaceId: workspace.id,
      restSeconds: fleetConfig.restSeconds,
      llmApiKey,
      model: requestedModel,
    });

    return c.json(
      {
        type: 'error',
        error: { type: 'rate_limit_error' },
        whiteroom: { reason: 'watch_limit_exceeded', retryAfter: fleetConfig.restSeconds },
      },
      429,
    );
  }

  const modelToUse = decision.action === 'reroute' ? decision.suggestedModel! : requestedModel;

  const handoverDoc = await getLatestHandover(db, agentId);
  let messages = body.messages || [];
  if (handoverDoc) {
    messages = injectHandover(messages, handoverDoc);
    await writeAuditEvent({
      db,
      workspaceId: workspace.id,
      fleetId: fleet.id,
      agentId,
      eventType: 'handover.injected',
    });
  }

  const provider = detectProviderFromModel(modelToUse);
  const client = createClient(provider);

  const response = await client.sendRequest(
    { model: modelToUse, messages, maxTokens: body.max_tokens, temperature: body.temperature },
    llmApiKey,
  );

  await updateAgentCounters(db, agentId, response.usage.inputTokens, response.usage.outputTokens);

  const costCents = calculateCostCents(response.usage.inputTokens, response.usage.outputTokens, modelToUse);
  await writeAuditEvent({
    db,
    workspaceId: workspace.id,
    fleetId: fleet.id,
    agentId,
    eventType: 'agent.response',
    tokensIn: response.usage.inputTokens,
    tokensOut: response.usage.outputTokens,
    model: modelToUse,
    costCents,
  });

  return c.json(response.raw);
});

export { trialProxy };
