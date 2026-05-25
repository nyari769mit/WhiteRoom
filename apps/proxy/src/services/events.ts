import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export interface SSEEvent {
  id: string;
  eventType: string;
  agentId?: string;
  payload?: Record<string, unknown>;
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
  costCents?: number;
  createdAt: string;
}

export function emitEvent(workspaceId: string, event: SSEEvent) {
  emitter.emit(`workspace:${workspaceId}`, event);
}

export function onWorkspaceEvent(
  workspaceId: string,
  listener: (event: SSEEvent) => void,
): () => void {
  const channel = `workspace:${workspaceId}`;
  emitter.on(channel, listener);
  return () => emitter.off(channel, listener);
}
