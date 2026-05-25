import { eq, and, agents, fleets } from '@whiteroom/db';
import type { DbClient } from '@whiteroom/db';
import { evaluateRequest } from '@whiteroom/engine';
import { generateId } from '@whiteroom/shared';
import type { AgentState, FleetConfig, GovernanceDecision, TaskTier } from '@whiteroom/shared';
import { resolvePairedAgent } from '../utils/resolve-paired-agent.js';

interface GovernanceParams {
  db: DbClient;
  workspaceId: string;
  fleetId: string;
  agentKey: string;
  requestedModel: string;
  estimatedTokens: number;
  taskTier?: TaskTier;
  taskName?: string;
}

interface GovernanceResult {
  decision: GovernanceDecision;
  agentId: string;
  fleetConfig: FleetConfig;
}

export async function runGovernanceCheck(params: GovernanceParams): Promise<GovernanceResult> {
  const { db, fleetId, agentKey, requestedModel, estimatedTokens, taskTier, taskName } = params;

  const [fleet] = await db.select().from(fleets).where(eq(fleets.id, fleetId)).limit(1);
  if (!fleet) throw new Error(`Fleet ${fleetId} not found`);

  const fleetConfig: FleetConfig = {
    fleetId: fleet.id,
    watchLimitTokens: fleet.watchLimitTokens,
    restSeconds: fleet.restSeconds,
  };

  const agentRow = await upsertAgent(db, fleetId, agentKey);

  const agentState: AgentState = {
    agentId: agentRow.id,
    fleetId: agentRow.fleetId,
    skills: agentRow.skills as string[],
    status: agentRow.status as AgentState['status'],
    currentWatchTokens: agentRow.currentWatchTokens,
    watchStartedAt: agentRow.watchStartedAt,
    restUntil: agentRow.restUntil,
    pairedWith: agentRow.pairedWith,
    inputTokens: agentRow.inputTokens,
    outputTokens: agentRow.outputTokens,
    callCount: agentRow.callCount,
  };

  const pairedAgent = await resolvePairedAgent(db, agentRow.id, fleetId, agentRow.pairedWith);

  const decision = evaluateRequest({
    agent: agentState,
    fleet: fleetConfig,
    estimatedTokens,
    taskTier,
    requestedModel,
    pairedAgent,
  });

  const stateUpdate: Record<string, unknown> = {};
  if (decision.newAgentState) {
    if (decision.newAgentState.status !== undefined) stateUpdate.status = decision.newAgentState.status;
    if (decision.newAgentState.currentWatchTokens !== undefined) stateUpdate.currentWatchTokens = decision.newAgentState.currentWatchTokens;
    if (decision.newAgentState.watchStartedAt !== undefined) stateUpdate.watchStartedAt = decision.newAgentState.watchStartedAt;
    if (decision.newAgentState.restUntil !== undefined) stateUpdate.restUntil = decision.newAgentState.restUntil;
  }
  if (taskName !== undefined) stateUpdate.currentTask = taskName;

  if (Object.keys(stateUpdate).length > 0) {
    await db.update(agents).set(stateUpdate).where(eq(agents.id, agentRow.id));
  }

  return { decision, agentId: agentRow.id, fleetConfig };
}

async function upsertAgent(db: DbClient, fleetId: string, agentKey: string) {
  const [existing] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.fleetId, fleetId), eq(agents.agentKey, agentKey)))
    .limit(1);

  if (existing) return existing;

  const id = generateId();
  await db.insert(agents).values({ id, fleetId, agentKey }).onConflictDoNothing();

  const [created] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.fleetId, fleetId), eq(agents.agentKey, agentKey)))
    .limit(1);

  if (!created) throw new Error(`Failed to upsert agent ${agentKey} in fleet ${fleetId}`);
  return created;
}

export async function updateAgentCounters(
  db: DbClient,
  agentId: string,
  tokensIn: number,
  tokensOut: number,
) {
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  if (!agent) return;

  await db
    .update(agents)
    .set({
      currentWatchTokens: agent.currentWatchTokens + tokensIn + tokensOut,
      inputTokens: agent.inputTokens + tokensIn,
      outputTokens: agent.outputTokens + tokensOut,
      callCount: agent.callCount + 1,
    })
    .where(eq(agents.id, agentId));
}
