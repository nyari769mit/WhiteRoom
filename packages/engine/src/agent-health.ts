import type { AgentState, FleetConfig } from '@whiteroom/shared';
import { watchProgress } from './watch-progress.js';

export function agentHealth(agent: AgentState, fleet: FleetConfig): number {
  if (agent.status === 'idle') return 100;

  if (agent.status === 'working') {
    if (fleet.watchLimitTokens === 0) return 20;
    const rawPercent = (agent.currentWatchTokens / fleet.watchLimitTokens) * 100;
    return Math.max(20, 100 - rawPercent * 0.75);
  }

  if (agent.status === 'resting' && agent.restUntil) {
    const now = Date.now();
    const restStart = agent.restUntil.getTime() - fleet.restSeconds * 1000;
    const elapsed = now - restStart;
    const total = fleet.restSeconds * 1000;
    if (total === 0) return 100;
    const recoveryPercent = Math.min(1, elapsed / total);
    return Math.min(100, 25 + recoveryPercent * 75);
  }

  return 100;
}
