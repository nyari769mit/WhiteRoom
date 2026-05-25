import { sql, workspaces } from '@whiteroom/db';
import type { DbClient } from '@whiteroom/db';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function startTrialCleanup(db: DbClient) {
  const interval = setInterval(async () => {
    try {
      await cleanupExpiredTrials(db);
    } catch (err) {
      console.error('Trial cleanup error:', err);
    }
  }, CLEANUP_INTERVAL_MS);

  cleanupExpiredTrials(db);

  return () => clearInterval(interval);
}

async function cleanupExpiredTrials(db: DbClient) {
  const deleted = await db
    .delete(workspaces)
    .where(
      sql`${workspaces.isEphemeral} = true AND ${workspaces.expiresAt} < now() - interval '48 hours'`,
    )
    .returning({ id: workspaces.id });

  if (deleted.length > 0) {
    console.log(`Cleaned up ${deleted.length} expired trial workspace(s)`);
  }
}
