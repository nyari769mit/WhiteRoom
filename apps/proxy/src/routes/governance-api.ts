import { Hono } from 'hono';
import { eq, and, desc, agents, fleets, auditEvents, agentPairs } from '@whiteroom/db';
import { generateId } from '@whiteroom/shared';
import { agentHealth, watchProgress } from '@whiteroom/engine';
import type { AgentState, FleetConfig } from '@whiteroom/shared';
import type { AppVariables } from '../types.js';

const governanceApi = new Hono<{ Variables: AppVariables }>();

governanceApi.post('/api/workspaces/:slug/agents/register', async (c) => {
  const db = c.get('db');
  const workspace = c.get('workspace');
  const body = await c.req.json();
  const { agentKey, name, skills, fleetId } = body;

  if (!agentKey || !fleetId) {
    return c.json({ error: 'agentKey and fleetId required' }, 400);
  }

  const id = generateId();
  await db
    .insert(agents)
    .values({ id, fleetId, agentKey, name, skills: skills || [] })
    .onConflictDoNothing();

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.fleetId, fleetId), eq(agents.agentKey, agentKey)))
    .limit(1);

  return c.json(agent);
});

governanceApi.get('/api/workspaces/:slug/agents/:agentId', async (c) => {
  const db = c.get('db');
  const agentId = c.req.param('agentId');

  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  const [fleet] = await db.select().from(fleets).where(eq(fleets.id, agent.fleetId)).limit(1);
  if (!fleet) return c.json({ error: 'Fleet not found' }, 404);

  const fleetConfig: FleetConfig = {
    fleetId: fleet.id,
    watchLimitTokens: fleet.watchLimitTokens,
    restSeconds: fleet.restSeconds,
  };

  const agentState: AgentState = {
    agentId: agent.id,
    fleetId: agent.fleetId,
    skills: agent.skills as string[],
    status: agent.status as AgentState['status'],
    currentWatchTokens: agent.currentWatchTokens,
    watchStartedAt: agent.watchStartedAt,
    restUntil: agent.restUntil,
    pairedWith: agent.pairedWith,
    inputTokens: agent.inputTokens,
    outputTokens: agent.outputTokens,
    callCount: agent.callCount,
  };

  return c.json({
    ...agent,
    health: agentHealth(agentState, fleetConfig),
    watchPercent: watchProgress(agentState, fleetConfig),
  });
});

governanceApi.post('/api/workspaces/:slug/agents/pair', async (c) => {
  const db = c.get('db');
  const body = await c.req.json();
  const { agentIdA, agentIdB, fleetId } = body;

  if (!agentIdA || !agentIdB || !fleetId) {
    return c.json({ error: 'agentIdA, agentIdB, and fleetId required' }, 400);
  }

  const id = generateId();
  await db.insert(agentPairs).values({ id, fleetId, agentIdA, agentIdB }).onConflictDoNothing();

  await db.update(agents).set({ pairedWith: agentIdB }).where(eq(agents.id, agentIdA));
  await db.update(agents).set({ pairedWith: agentIdA }).where(eq(agents.id, agentIdB));

  return c.json({ paired: true, agentIdA, agentIdB });
});

governanceApi.get('/api/workspaces/:slug/fleets/:fleetId/report', async (c) => {
  const db = c.get('db');
  const fleetId = c.req.param('fleetId');

  const [fleet] = await db.select().from(fleets).where(eq(fleets.id, fleetId)).limit(1);
  if (!fleet) return c.json({ error: 'Fleet not found' }, 404);

  const fleetAgents = await db.select().from(agents).where(eq(agents.fleetId, fleetId));

  const fleetConfig: FleetConfig = {
    fleetId: fleet.id,
    watchLimitTokens: fleet.watchLimitTokens,
    restSeconds: fleet.restSeconds,
  };

  const agentSummaries = fleetAgents.map((a) => {
    const state: AgentState = {
      agentId: a.id,
      fleetId: a.fleetId,
      skills: a.skills as string[],
      status: a.status as AgentState['status'],
      currentWatchTokens: a.currentWatchTokens,
      watchStartedAt: a.watchStartedAt,
      restUntil: a.restUntil,
      pairedWith: a.pairedWith,
      inputTokens: a.inputTokens,
      outputTokens: a.outputTokens,
      callCount: a.callCount,
    };
    return {
      id: a.id,
      agentKey: a.agentKey,
      name: a.name,
      status: a.status,
      currentTask: a.currentTask,
      health: agentHealth(state, fleetConfig),
      watchPercent: watchProgress(state, fleetConfig),
      inputTokens: a.inputTokens,
      outputTokens: a.outputTokens,
      callCount: a.callCount,
    };
  });

  return c.json({
    fleet: { id: fleet.id, name: fleet.name, watchLimitTokens: fleet.watchLimitTokens, restSeconds: fleet.restSeconds },
    agents: agentSummaries,
    totals: {
      inputTokens: agentSummaries.reduce((s, a) => s + a.inputTokens, 0),
      outputTokens: agentSummaries.reduce((s, a) => s + a.outputTokens, 0),
      callCount: agentSummaries.reduce((s, a) => s + a.callCount, 0),
    },
  });
});

governanceApi.get('/api/workspaces/:slug/audit', async (c) => {
  const db = c.get('db');
  const workspace = c.get('workspace');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 200);
  const offset = parseInt(c.req.query('offset') || '0');

  const events = await db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.workspaceId, workspace.id))
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({ events, limit, offset });
});

export { governanceApi };
