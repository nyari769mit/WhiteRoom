import type { AgentState, PairedAgentState } from '@whiteroom/shared';

export interface ShouldFireAlarmParams {
  agent: AgentState;
  pairedAgent?: PairedAgentState;
  now: Date;
}

export function shouldFireAlarm(params: ShouldFireAlarmParams): boolean {
  const { agent, pairedAgent, now } = params;

  if (agent.status !== 'resting') return false;
  if (!agent.restUntil || now < agent.restUntil) return false;
  if (pairedAgent && pairedAgent.status === 'working') return false;

  return true;
}
