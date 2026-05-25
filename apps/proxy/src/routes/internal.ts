import { Hono } from 'hono';
import { eq, users, workspaces, fleets, apiKeys } from '@whiteroom/db';
import { generateId, generateApiKey } from '@whiteroom/shared';
import { createHash } from 'node:crypto';
import type { AppVariables } from '../types.js';

const internal = new Hono<{ Variables: AppVariables }>();

internal.post('/api/internal/users', async (c) => {
  const db = c.get('db');
  const { clerkId, email, name } = await c.req.json();

  const userId = generateId();
  await db
    .insert(users)
    .values({ id: userId, clerkId, email, name })
    .onConflictDoNothing();

  return c.json({ userId });
});

internal.post('/api/trial/:token/promote', async (c) => {
  const db = c.get('db');
  const token = c.req.param('token');
  const { userId } = await c.req.json();

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.trialToken, token))
    .limit(1);

  if (!workspace) {
    return c.json({ error: 'Trial not found' }, 404);
  }

  const slug = `ws-${generateId().slice(0, 8)}`;

  await db
    .update(workspaces)
    .set({
      isEphemeral: false,
      expiresAt: null,
      ownerUserId: userId,
      slug,
      name: 'My Workspace',
      tier: 'pro',
    })
    .where(eq(workspaces.id, workspace.id));

  const rawKey = generateApiKey();
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const keyId = generateId();

  await db.insert(apiKeys).values({
    id: keyId,
    workspaceId: workspace.id,
    name: 'Default',
    keyHash,
    keyPrefix: rawKey.slice(0, 7),
  });

  return c.json({
    workspaceId: workspace.id,
    slug,
    apiKey: rawKey,
  });
});

internal.get('/api/workspaces/by-user/:clerkId', async (c) => {
  const db = c.get('db');
  const clerkId = c.req.param('clerkId');

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return c.json({ workspaces: [] });

  const userWorkspaces = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, user.id));

  return c.json({ workspaces: userWorkspaces });
});

internal.get('/api/workspaces/:slug/details', async (c) => {
  const db = c.get('db');
  const slug = c.req.param('slug');

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
  if (!workspace) return c.json({ error: 'Not found' }, 404);

  const wsFleets = await db.select().from(fleets).where(eq(fleets.workspaceId, workspace.id));
  const wsKeys = await db
    .select({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, createdAt: apiKeys.createdAt, revokedAt: apiKeys.revokedAt })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, workspace.id));

  return c.json({ workspace, fleets: wsFleets, apiKeys: wsKeys });
});

internal.post('/api/workspaces/:slug/api-keys', async (c) => {
  const db = c.get('db');
  const slug = c.req.param('slug');
  const { name } = await c.req.json();

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
  if (!workspace) return c.json({ error: 'Not found' }, 404);

  const rawKey = generateApiKey();
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const keyId = generateId();

  await db.insert(apiKeys).values({
    id: keyId,
    workspaceId: workspace.id,
    name: name || 'Untitled',
    keyHash,
    keyPrefix: rawKey.slice(0, 7),
  });

  return c.json({ id: keyId, key: rawKey, prefix: rawKey.slice(0, 7) });
});

internal.delete('/api/workspaces/:slug/api-keys/:keyId', async (c) => {
  const db = c.get('db');
  const keyId = c.req.param('keyId');

  await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, keyId));
  return c.json({ revoked: true });
});

internal.post('/api/workspaces/:slug/upgrade', async (c) => {
  return c.json({
    message: 'Contact us at hello@whiteroom.tech to upgrade.',
    email: 'hello@whiteroom.tech',
  });
});

export { internal };
