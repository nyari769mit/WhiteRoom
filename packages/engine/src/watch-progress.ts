import type { AgentState, FleetConfig } from '@whiteroom/shared';

export function watchProgress(agent: AgentState, fleet: FleetConfig): number {
  if (fleet.watchLimitTokens === 0) return 100;
  return Math.min(100, (agent.currentWatchTokens / fleet.watchLimitTokens) * 100);
}
