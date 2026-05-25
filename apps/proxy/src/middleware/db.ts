import { createMiddleware } from 'hono/factory';
import { createDbClient, type DbClient } from '@whiteroom/db';
import type { AppVariables } from '../types.js';

let dbClient: DbClient | null = null;

export const dbMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  if (!dbClient) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      return c.json({ error: 'DATABASE_URL not configured' }, 500);
    }
    dbClient = createDbClient(url);
  }
  c.set('db', dbClient);
  await next();
});
