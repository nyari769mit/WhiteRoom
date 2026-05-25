import type { SSEEvent } from '@/hooks/use-sse';

export interface DerivedAgent {
  agentId: string;
  status: 'working' | 'resting' | 'idle';
  currentTask?: string;
  tokensIn: number;
  tokensOut: number;
  callCount: number;
  watchPercent: number;
}

export function deriveAgents(events: SSEEvent[]): DerivedAgent[] {
  const agentMap = new Map<string, DerivedAgent>();

  for (const event of [...events].reverse()) {
    if (!event.agentId) continue;
    const existing = agentMap.get(event.agentId) || {
      agentId: event.agentId,
      status: 'idle' as const,
      tokensIn: 0,
      tokensOut: 0,
      callCount: 0,
      watchPercent: 0,
    };

    if (event.eventType === 'agent.response') {
      existing.tokensIn += event.tokensIn ?? 0;
      existing.tokensOut += event.tokensOut ?? 0;
      existing.callCount += 1;
      existing.status = 'working';
    }
    if (event.eventType === 'agent.resting') existing.status = 'resting';
    if (event.eventType === 'agent.alarm_fired') existing.status = 'idle';
    if (event.payload?.taskName) existing.currentTask = event.payload.taskName as string;

    agentMap.set(event.agentId, existing);
  }

  return Array.from(agentMap.values());
}
