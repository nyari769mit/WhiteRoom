import { initSentry, Sentry } from './services/sentry.js';
initSentry();

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppVariables } from './types.js';
import { dbMiddleware } from './middleware/db.js';
import { workspaceFromApiKey } from './middleware/workspace.js';
import { tierEnforcement } from './middleware/tier-enforcement.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { securityHeaders } from './middleware/security-headers.js';
import { health } from './routes/health.js';
import { proxy } from './routes/proxy.js';
import { trial } from './routes/trial.js';
import { trialProxy } from './routes/trial-proxy.js';
import { events } from './routes/events.js';
import { governanceApi } from './routes/governance-api.js';
import { internal } from './routes/internal.js';
import { startAlarmChecker } from './services/alarm-checker.js';
import { startTrialCleanup } from './services/trial-cleanup.js';
import { createDbClient } from '@whiteroom/db';

const app = new Hono<{ Variables: AppVariables }>();

app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Agent-Id', 'X-Task-Tier', 'X-Task-Name'],
    exposeHeaders: ['X-WhiteRoom-Decision'],
  }),
);

app.use('*', securityHeaders);
app.route('/', health);

app.use('/api/*', dbMiddleware);
app.use('/t/*', dbMiddleware);
app.use('/v1/messages', dbMiddleware, workspaceFromApiKey, rateLimiter, tierEnforcement);
app.use('/v1/chat/completions', dbMiddleware, workspaceFromApiKey, rateLimiter, tierEnforcement);

app.route('/', trial);
app.route('/', trialProxy);
app.route('/', events);
app.route('/', governanceApi);
app.route('/', internal);
app.route('/', proxy);

app.onError((err, c) => {
  Sentry.captureException(err);
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '8080', 10);
serve({ fetch: app.fetch, port }, () => {
  console.log(`WhiteRoom proxy listening on port ${port}`);

  if (process.env.DATABASE_URL) {
    const db = createDbClient(process.env.DATABASE_URL);
    startAlarmChecker(db);
    startTrialCleanup(db);
    console.log('Alarm checker + trial cleanup started');
  }
});

export default app;
