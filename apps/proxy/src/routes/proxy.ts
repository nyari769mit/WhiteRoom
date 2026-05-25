import { Hono } from 'hono';
import { eq, fleets } from '@whiteroom/db';
import { createClient, detectProviderFromModel, injectHandover } from '@whiteroom/llm-clients';
import { calculateCostCents } from '@whiteroom/shared';
import type { TaskTier } from '@whiteroom/shared';
import type { AppVariables } from '../types.js';
import { runGovernanceCheck, updateAgentCounters } from '../services/governance.js';
import { generateHandover, getLatestHandover } from '../services/handover.js';
import { writeAuditEvent } from '../services/audit.js';
import { estimateTokens } from '../utils/estimate-tokens.js';

const proxy = new Hono<{ Variables: AppVariables }>();

proxy.post('/v1/messages', async (c) => {
  const db = c.get('db');
  const workspace = c.get('workspace');
  const agentKey = c.req.header('X-Agent-Id') || 'default';
  const taskTier = (c.req.header('X-Task-Tier') as TaskTier) || undefined;
  const taskName = c.req.header('X-Task-Name') || undefined;
  const llmApiKey = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!llmApiKey) {
    return c.json({ error: 'Missing Authorization header with LLM API key' }, 401);
  }

  const body = await c.req.json();
  const requestedModel = body.model || 'claude-sonnet-4-5';

  const [fleet] = await db
    .select()
    .from(fleets)
    .where(eq(fleets.workspaceId, workspace.id))
    .limit(1);

  if (!fleet) {
    return c.json({ error: 'No fleet configured for workspace' }, 500);
  }

  const { decision, agentId, fleetConfig } = await runGovernanceCheck({
    db,
    workspaceId: workspace.id,
    fleetId: fleet.id,
    agentKey,
    requestedModel,
    estimatedTokens: estimateTokens(body),
    taskTier,
    taskName,
  });

  c.header('X-WhiteRoom-Decision', decision.action);

  await writeAuditEvent({
    db,
    workspaceId: workspace.id,
    fleetId: fleet.id,
    agentId,
    eventType: 'routing.decision',
    payload: { action: decision.action, reason: decision.reason, model: requestedModel, taskName },
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
    const handoverId = await generateHandover({
      db,
      fleetId: fleet.id,
      agentId,
      workspaceId: workspace.id,
      restSeconds: fleetConfig.restSeconds,
      llmApiKey,
      model: requestedModel,
    });

    await writeAuditEvent({
      db,
      workspaceId: workspace.id,
      fleetId: fleet.id,
      agentId,
      eventType: 'handover.generated',
      payload: { handoverId },
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
    payload: { taskName, task: body.messages?.[body.messages.length - 1]?.content?.slice(0, 100) },
  });

  return c.json(response.raw);
});

proxy.post('/v1/chat/completions', async (c) => {
  const db = c.get('db');
  const workspace = c.get('workspace');
  const agentKey = c.req.header('X-Agent-Id') || 'default';
  const taskTier = (c.req.header('X-Task-Tier') as TaskTier) || undefined;
  const taskName = c.req.header('X-Task-Name') || undefined;
  const llmApiKey = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!llmApiKey) {
    return c.json({ error: { message: 'Missing Authorization header', type: 'auth_error' } }, 401);
  }

  const body = await c.req.json();
  const requestedModel = body.model || 'gpt-4o';

  const [fleet] = await db
    .select()
    .from(fleets)
    .where(eq(fleets.workspaceId, workspace.id))
    .limit(1);

  if (!fleet) {
    return c.json({ error: { message: 'No fleet configured', type: 'server_error' } }, 500);
  }

  const { decision, agentId, fleetConfig } = await runGovernanceCheck({
    db,
    workspaceId: workspace.id,
    fleetId: fleet.id,
    agentKey,
    requestedModel,
    estimatedTokens: estimateTokens(body),
    taskTier,
    taskName,
  });

  c.header('X-WhiteRoom-Decision', decision.action);

  if (decision.action === 'block') {
    return c.json(
      {
        error: { message: 'Agent is resting', type: 'rate_limit_error' },
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
        error: { message: 'Watch limit exceeded', type: 'rate_limit_error' },
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

export { proxy };
