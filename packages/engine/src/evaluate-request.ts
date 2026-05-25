import type { AgentState, FleetConfig, GovernanceDecision, PairedAgentState, TaskTier } from '@whiteroom/shared';
import { shouldFireAlarm } from './should-fire-alarm.js';
import { selectModelForTier } from './model-routing.js';

export interface EvaluateRequestParams {
  agent: AgentState;
  fleet: FleetConfig;
  estimatedTokens: number;
  taskTier?: TaskTier;
  requestedModel: string;
  pairedAgent?: PairedAgentState;
  now?: Date;
}

export function evaluateRequest(params: EvaluateRequestParams): GovernanceDecision {
  const { agent, fleet, estimatedTokens, taskTier, requestedModel, pairedAgent } = params;
  const now = params.now ?? new Date();

  if (agent.status === 'resting') {
    if (agent.restUntil && now < agent.restUntil) {
      const retryAfterSeconds = Math.ceil((agent.restUntil.getTime() - now.getTime()) / 1000);
      return {
        action: 'block',
        reason: 'Agent is resting',
        retryAfterSeconds,
      };
    }

    const canWake = shouldFireAlarm({ agent, pairedAgent, now });
    if (!canWake) {
      return {
        action: 'block',
        reason: 'Agent is resting — paired agent is still working',
        retryAfterSeconds: fleet.restSeconds,
      };
    }

    return {
      action: 'allow',
      reason: 'Agent rest period complete, starting fresh watch',
      newAgentState: {
        status: 'working',
        currentWatchTokens: 0,
        watchStartedAt: now,
        restUntil: null,
      },
    };
  }

  if (agent.status === 'idle') {
    return {
      action: 'allow',
      reason: 'Agent starting new watch',
      newAgentState: {
        status: 'working',
        currentWatchTokens: 0,
        watchStartedAt: now,
      },
    };
  }

  if (agent.currentWatchTokens + estimatedTokens > fleet.watchLimitTokens) {
    return {
      action: 'compress',
      reason: 'Watch token limit reached',
      shouldGenerateHandover: true,
    };
  }

  if (taskTier) {
    const routing = selectModelForTier(requestedModel, taskTier);
    if (routing.rerouted) {
      return {
        action: 'reroute',
        reason: routing.reason,
        suggestedModel: routing.model,
      };
    }
  }

  return {
    action: 'allow',
    reason: 'Request within watch limits',
  };
}
