import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { eq, workspaces } from '@whiteroom/db';
import type { AppVariables } from '../types.js';
import { onWorkspaceEvent } from '../services/events.js';

const events = new Hono<{ Variables: AppVariables }>();

events.get('/api/workspaces/:slug/events/stream', async (c) => {
  const db = c.get('db');
  const slug = c.req.param('slug');

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (!workspace) {
    return c.json({ error: 'Workspace not found' }, 404);
  }

  return streamSSE(c, async (stream) => {
    const unsubscribe = onWorkspaceEvent(workspace.id, (event) => {
      stream.writeSSE({ data: JSON.stringify(event), event: event.eventType, id: event.id });
    });

    const heartbeat = setInterval(() => {
      stream.writeSSE({ data: '', event: 'heartbeat', id: '' });
    }, 15_000);

    stream.onAbort(() => {
      unsubscribe();
      clearInterval(heartbeat);
    });

    while (true) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  });
});

export { events };
