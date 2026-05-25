import { createMiddleware } from 'hono/factory';
import { eq, workspaces, apiKeys } from '@whiteroom/db';
import { createHash } from 'node:crypto';
import type { AppVariables } from '../types.js';

export const workspaceFromApiKey = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer wr_')) {
    return c.json({ error: 'Missing or invalid API key' }, 401);
  }

  const key = authHeader.slice(7);
  const keyHash = createHash('sha256').update(key).digest('hex');
  const db = c.get('db');

  const [found] = await db
    .select({ workspaceId: apiKeys.workspaceId, revokedAt: apiKeys.revokedAt })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!found || found.revokedAt) {
    return c.json({ error: 'Invalid or revoked API key' }, 401);
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, found.workspaceId))
    .limit(1);

  if (!workspace) {
    return c.json({ error: 'Workspace not found' }, 404);
  }

  c.set('workspace', workspace);
  await next();
});

export const workspaceFromTrialToken = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const token = c.req.param('trial_token');
  if (!token) {
    return c.json({ error: 'Missing trial token' }, 400);
  }

  const db = c.get('db');
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.trialToken, token))
    .limit(1);

  if (!workspace) {
    return c.json({ error: 'Invalid trial token' }, 404);
  }

  if (workspace.expiresAt && workspace.expiresAt < new Date()) {
    return c.json(
      { type: 'error', error: { type: 'trial_expired' }, message: 'Trial has expired' },
      410,
    );
  }

  c.set('workspace', workspace);
  await next();
});
