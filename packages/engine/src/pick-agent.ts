import type { AgentState, TaskTier } from '@whiteroom/shared';

export interface PickAgentParams {
  candidates: AgentState[];
  requiredSkills: string[];
  taskTier: TaskTier;
}

/** Selects the best available agent for a task based on skill match and current utilization. Prefers idle agents, then least-loaded. */
export function pickAgentForTask(
  params: PickAgentParams,
): { agentId: string; reason: string } | null {
  const { candidates, requiredSkills } = params;

  const available = candidates.filter((agent) => {
    if (agent.status === 'resting') return false;
    if (requiredSkills.length === 0) return true;
    return requiredSkills.every((skill) => agent.skills.includes(skill));
  });

  if (available.length === 0) return null;

  available.sort((a, b) => {
    if (a.status === 'idle' && b.status !== 'idle') return -1;
    if (b.status === 'idle' && a.status !== 'idle') return 1;
    return a.currentWatchTokens - b.currentWatchTokens;
  });

  const picked = available[0];
  return {
    agentId: picked.agentId,
    reason: `Selected ${picked.agentId}: ${picked.status}, ${picked.currentWatchTokens} tokens used`,
  };
}
