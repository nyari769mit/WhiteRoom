import { calculateCostCents } from '@whiteroom/shared';

export interface EstimateSavingsParams {
  inputTokens: number;
  outputTokens: number;
  callCount: number;
  handoverCount: number;
  model: string;
}

export interface SavingsResult {
  tokensWithout: number;
  tokensWith: number;
  costWithoutCents: number;
  costWithCents: number;
  savedCents: number;
}

/** Calculates token and cost savings from governance using the compounding formula: without WhiteRoom, context grows quadratically; with WhiteRoom, it stays flat. */
export function estimateSavings(params: EstimateSavingsParams): SavingsResult {
  const { inputTokens, outputTokens, callCount, model } = params;

  if (callCount === 0) {
    return { tokensWithout: 0, tokensWith: 0, costWithoutCents: 0, costWithCents: 0, savedCents: 0 };
  }

  const totalTokens = inputTokens + outputTokens;
  const avgTokensPerCall = totalTokens / callCount;

  const tokensWithout = avgTokensPerCall * callCount * (callCount + 1) / 2;
  const tokensWith = totalTokens;

  const inputRatio = inputTokens / totalTokens;
  const outputRatio = outputTokens / totalTokens;

  const costWithoutCents = calculateCostCents(
    Math.round(tokensWithout * inputRatio),
    Math.round(tokensWithout * outputRatio),
    model,
  );
  const costWithCents = calculateCostCents(inputTokens, outputTokens, model);
  const savedCents = costWithoutCents - costWithCents;

  return { tokensWithout, tokensWith, costWithoutCents, costWithCents, savedCents };
}
