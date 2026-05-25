import { Hono } from 'hono';
import { generateId, generateTrialToken, TRIAL_TTL_HOURS } from '@whiteroom/shared';
import { workspaces, fleets } from '@whiteroom/db';
import type { AppVariables } from '../types.js';

const trial = new Hono<{ Variables: AppVariables }>();

trial.post('/api/trial/create', async (c) => {
  const db = c.get('db');
  const token = generateTrialToken();
  const workspaceId = generateId();
  const fleetId = generateId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRIAL_TTL_HOURS * 60 * 60 * 1000);

  await db.insert(workspaces).values({
    id: workspaceId,
    name: `Trial ${token}`,
    slug: `trial-${token}`,
    tier: 'trial',
    isEphemeral: true,
    trialToken: token,
    expiresAt,
  });

  await db.insert(fleets).values({
    id: fleetId,
    workspaceId,
    name: 'Default Fleet',
  });

  const proxyBase = process.env.PROXY_BASE_URL || `http://localhost:${process.env.PORT || '8080'}`;
  const dashboardBase = process.env.DASHBOARD_BASE_URL || 'http://localhost:3000';

  return c.json({
    trial_token: token,
    proxy_url: `${proxyBase}/t/${token}/v1/messages`,
    dashboard_url: `${dashboardBase}/t/${token}`,
    expires_at: expiresAt.toISOString(),
  });
});

export { trial };
