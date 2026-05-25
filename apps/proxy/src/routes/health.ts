import { Hono } from 'hono';
import type { AppVariables } from '../types.js';

const health = new Hono<{ Variables: AppVariables }>();

health.get('/v1/health', (c) => {
  return c.json({ ok: true, version: '2.0.0', timestamp: new Date().toISOString() });
});

export { health };
