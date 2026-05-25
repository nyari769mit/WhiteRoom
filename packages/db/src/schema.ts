import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  jsonb,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  clerkId: text('clerk_id').unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workspaces = pgTable(
  'workspaces',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    ownerUserId: text('owner_user_id').references(() => users.id),
    tier: text('tier', { enum: ['trial', 'pro', 'enterprise'] }).notNull().default('trial'),
    isEphemeral: boolean('is_ephemeral').notNull().default(false),
    trialToken: text('trial_token').unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('workspaces_slug_idx').on(t.slug),
    index('workspaces_expires_at_idx').on(t.expiresAt),
    index('workspaces_trial_token_idx').on(t.trialToken),
  ],
);

export const fleets = pgTable('fleets', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  watchLimitTokens: integer('watch_limit_tokens').notNull().default(100_000),
  restSeconds: integer('rest_seconds').notNull().default(60),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agents = pgTable(
  'agents',
  {
    id: text('id').primaryKey(),
    fleetId: text('fleet_id')
      .references(() => fleets.id, { onDelete: 'cascade' })
      .notNull(),
    agentKey: text('agent_key').notNull(),
    name: text('name'),
    skills: jsonb('skills').$type<string[]>().notNull().default([]),
    status: text('status', { enum: ['idle', 'working', 'resting'] })
      .notNull()
      .default('idle'),
    currentWatchTokens: integer('current_watch_tokens').notNull().default(0),
    watchStartedAt: timestamp('watch_started_at', { withTimezone: true }),
    restUntil: timestamp('rest_until', { withTimezone: true }),
    pairedWith: text('paired_with'),
    inputTokens: bigint('input_tokens', { mode: 'number' }).notNull().default(0),
    outputTokens: bigint('output_tokens', { mode: 'number' }).notNull().default(0),
    callCount: integer('call_count').notNull().default(0),
    currentTask: text('current_task'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('agents_fleet_agent_key_idx').on(t.fleetId, t.agentKey),
    index('agents_fleet_id_idx').on(t.fleetId),
  ],
);

export const agentPairs = pgTable(
  'agent_pairs',
  {
    id: text('id').primaryKey(),
    fleetId: text('fleet_id')
      .references(() => fleets.id, { onDelete: 'cascade' })
      .notNull(),
    agentIdA: text('agent_id_a')
      .references(() => agents.id, { onDelete: 'cascade' })
      .notNull(),
    agentIdB: text('agent_id_b')
      .references(() => agents.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('agent_pairs_unique_idx').on(t.agentIdA, t.agentIdB)],
);

export const handoverDocuments = pgTable(
  'handover_documents',
  {
    id: text('id').primaryKey(),
    fleetId: text('fleet_id')
      .references(() => fleets.id, { onDelete: 'cascade' })
      .notNull(),
    fromAgentId: text('from_agent_id')
      .references(() => agents.id, { onDelete: 'cascade' })
      .notNull(),
    toAgentId: text('to_agent_id').references(() => agents.id, { onDelete: 'cascade' }),
    document: jsonb('document').notNull(),
    tokensUsed: integer('tokens_used').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('handover_documents_fleet_idx').on(t.fleetId)],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    fleetId: text('fleet_id'),
    agentId: text('agent_id'),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload'),
    tokensIn: integer('tokens_in'),
    tokensOut: integer('tokens_out'),
    model: text('model'),
    costCents: real('cost_cents'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('audit_events_workspace_created_idx').on(t.workspaceId, t.createdAt),
    index('audit_events_agent_idx').on(t.agentId),
  ],
);

export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .references(() => workspaces.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [
    index('api_keys_workspace_idx').on(t.workspaceId),
    index('api_keys_hash_idx').on(t.keyHash),
  ],
);
