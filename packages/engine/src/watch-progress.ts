import type { AgentState, FleetConfig } from '@whiteroom/shared';

/** Returns the agent's current watch completion as a percentage (0-100). */
export function watchProgress(agent: AgentState, fleet: FleetConfig): number {
  if (fleet.watchLimitTokens === 0) return 100;
  return Math.min(100, (agent.currentWatchTokens / fleet.watchLimitTokens) * 100);
}
