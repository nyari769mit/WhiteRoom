import { describe, it, expect } from 'vitest';
import { estimateSavings } from '../estimate-savings.js';

describe('estimateSavings', () => {
  it('returns zero for zero calls', () => {
    const result = estimateSavings({
      inputTokens: 0,
      outputTokens: 0,
      callCount: 0,
      handoverCount: 0,
      model: 'claude-sonnet-4-5',
    });
    expect(result.tokensWithout).toBe(0);
    expect(result.tokensWith).toBe(0);
    expect(result.savedCents).toBe(0);
  });

  it('returns zero savings for 1 call (no compounding yet)', () => {
    const result = estimateSavings({
      inputTokens: 500,
      outputTokens: 500,
      callCount: 1,
      handoverCount: 0,
      model: 'claude-sonnet-4-5',
    });
    expect(result.tokensWithout).toBe(1000);
    expect(result.tokensWith).toBe(1000);
    expect(result.savedCents).toBe(0);
  });

  it('shows significant savings for 10 calls (compounding)', () => {
    const result = estimateSavings({
      inputTokens: 5000,
      outputTokens: 5000,
      callCount: 10,
      handoverCount: 1,
      model: 'claude-sonnet-4-5',
    });
    expect(result.tokensWithout).toBe(55_000);
    expect(result.tokensWith).toBe(10_000);
    expect(result.tokensWithout).toBeGreaterThan(result.tokensWith);
    expect(result.savedCents).toBeGreaterThan(0);
  });

  it('does NOT use hardcoded 40K multiplier (v1 bug #2 regression)', () => {
    const result = estimateSavings({
      inputTokens: 3000,
      outputTokens: 3000,
      callCount: 5,
      handoverCount: 2,
      model: 'claude-sonnet-4-5',
    });
    const hardcodedWouldBe = 2 * 40_000;
    expect(result.tokensWithout - result.tokensWith).not.toBe(hardcodedWouldBe);
  });

  it('calculates cost using model pricing', () => {
    const result = estimateSavings({
      inputTokens: 50_000,
      outputTokens: 50_000,
      callCount: 10,
      handoverCount: 1,
      model: 'claude-opus-4-7',
    });
    expect(result.costWithoutCents).toBeGreaterThan(0);
    expect(result.costWithCents).toBeGreaterThan(0);
    expect(result.savedCents).toBe(result.costWithoutCents - result.costWithCents);
  });

  it('returns zero cost for unknown model', () => {
    const result = estimateSavings({
      inputTokens: 1000,
      outputTokens: 1000,
      callCount: 5,
      handoverCount: 1,
      model: 'unknown-model',
    });
    expect(result.costWithoutCents).toBe(0);
    expect(result.costWithCents).toBe(0);
  });
});
