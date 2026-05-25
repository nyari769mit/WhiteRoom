import { createDbClient } from './client.js';
import * as schema from './schema.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const db = createDbClient(DATABASE_URL);

async function seed() {
  console.log('Seeding database...');

  const userId = 'user_seed_001';
  await db.insert(schema.users).values({
    id: userId,
    email: 'demo@whiteroom.tech',
    name: 'Demo User',
  }).onConflictDoNothing();

  const workspaceId = 'ws_seed_001';
  await db.insert(schema.workspaces).values({
    id: workspaceId,
    name: 'Demo Workspace',
    slug: 'demo',
    ownerUserId: userId,
    tier: 'pro',
    isEphemeral: false,
  }).onConflictDoNothing();

  const fleetId = 'fleet_seed_001';
  await db.insert(schema.fleets).values({
    id: fleetId,
    workspaceId,
    name: 'Default Fleet',
    watchLimitTokens: 100_000,
    restSeconds: 60,
  }).onConflictDoNothing();

  const agentA = 'agent_seed_001';
  const agentB = 'agent_seed_002';

  await db.insert(schema.agents).values([
    {
      id: agentA,
      fleetId,
      agentKey: 'agent-alpha',
      name: 'Agent Alpha',
      skills: ['coding', 'analysis'],
      status: 'idle',
    },
    {
      id: agentB,
      fleetId,
      agentKey: 'agent-beta',
      name: 'Agent Beta',
      skills: ['coding', 'review'],
      status: 'idle',
    },
  ]).onConflictDoNothing();

  await db.insert(schema.agentPairs).values({
    id: 'pair_seed_001',
    fleetId,
    agentIdA: agentA,
    agentIdB: agentB,
  }).onConflictDoNothing();

  const now = new Date();
  await db.insert(schema.auditEvents).values([
    {
      id: 'evt_seed_001',
      workspaceId,
      fleetId,
      agentId: agentA,
      eventType: 'agent.registered',
      payload: { agentKey: 'agent-alpha' },
      createdAt: new Date(now.getTime() - 3600_000),
    },
    {
      id: 'evt_seed_002',
      workspaceId,
      fleetId,
      agentId: agentA,
      eventType: 'agent.request',
      payload: { model: 'claude-sonnet-4-5' },
      tokensIn: 1500,
      tokensOut: 800,
      model: 'claude-sonnet-4-5',
      costCents: 0.12,
      createdAt: new Date(now.getTime() - 1800_000),
    },
    {
      id: 'evt_seed_003',
      workspaceId,
      fleetId,
      agentId: agentB,
      eventType: 'agent.registered',
      payload: { agentKey: 'agent-beta' },
      createdAt: new Date(now.getTime() - 900_000),
    },
  ]).onConflictDoNothing();

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
