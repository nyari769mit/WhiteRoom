import type { TaskTier } from '@whiteroom/shared';
import { TIER_MODEL_MAP } from '@whiteroom/shared';

export interface RoutingResult {
  model: string;
  rerouted: boolean;
  reason: string;
}

const OPUS_MODELS = ['claude-opus-4-7', 'claude-opus-4-6'];
const HAIKU_MODELS = ['claude-haiku-4-5'];
const EXPENSIVE_MODELS = [...OPUS_MODELS, 'gpt-4o', 'gpt-4.1'];
const CHEAP_MODELS = [...HAIKU_MODELS, 'gpt-4o-mini', 'gpt-4.1-mini'];

/** Routes requests to the appropriate model tier — downgrades expensive models for simple tasks, upgrades cheap models for complex tasks. */
export function selectModelForTier(requestedModel: string, taskTier: TaskTier): RoutingResult {
  if (taskTier === 'simple' && EXPENSIVE_MODELS.includes(requestedModel)) {
    const suggested = TIER_MODEL_MAP.simple;
    return {
      model: suggested,
      rerouted: true,
      reason: `Simple task: downgraded from ${requestedModel} to ${suggested}`,
    };
  }

  if (taskTier === 'complex' && CHEAP_MODELS.includes(requestedModel)) {
    const suggested = TIER_MODEL_MAP.complex;
    return {
      model: suggested,
      rerouted: true,
      reason: `Complex task: upgraded from ${requestedModel} to ${suggested}`,
    };
  }

  return {
    model: requestedModel,
    rerouted: false,
    reason: 'Model matches task tier',
  };
}
