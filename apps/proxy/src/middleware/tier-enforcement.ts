import { createMiddleware } from 'hono/factory';
import type { AppVariables } from '../types.js';

export const tierEnforcement = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const workspace = c.get('workspace');

  if (workspace.tier === 'trial' && workspace.expiresAt) {
    if (new Date() > workspace.expiresAt) {
      return c.json(
        {
          type: 'error',
          error: { type: 'trial_expired' },
          message: 'Trial has expired. Sign up to continue.',
        },
        410,
      );
    }
  }

  await next();
});
