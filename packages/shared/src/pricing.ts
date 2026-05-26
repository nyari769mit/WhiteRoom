import type { TaskTier } from './types.js';

export interface ModelPricing {
  inputPerMToken: number;
  outputPerMToken: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-7': { inputPerMToken: 15.0, outputPerMToken: 75.0 },
  'claude-sonnet-4-5': { inputPerMToken: 3.0, outputPerMToken: 15.0 },
  'claude-haiku-4-5': { inputPerMToken: 0.8, outputPerMToken: 4.0 },
  'gpt-4o': { inputPerMToken: 2.5, outputPerMToken: 10.0 },
  'gpt-4o-mini': { inputPerMToken: 0.15, outputPerMToken: 0.6 },
  'gpt-4.1': { inputPerMToken: 2.0, outputPerMToken: 8.0 },
  'gpt-4.1-mini': { inputPerMToken: 0.4, outputPerMToken: 1.6 },
};

export const TIER_MODEL_MAP: Record<TaskTier, string> = {
  simple: 'claude-haiku-4-5',
  standard: 'claude-sonnet-4-5',
  complex: 'claude-opus-4-7',
};

/** Calculates the estimated cost in cents for a given number of input/output tokens on a specific model. Returns 0 for unknown models. */
export function calculateCostCents(
  inputTokens: number,
  outputTokens: number,
  model: string,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMToken;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMToken;
  return Math.round((inputCost + outputCost) * 100);
}
