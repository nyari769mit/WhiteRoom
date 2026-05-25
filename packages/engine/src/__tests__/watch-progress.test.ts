import { describe, it, expect } from 'vitest';
import { watchProgress } from '../watch-progress.js';
import type { AgentState, FleetConfig } from '@whiteroom/shared';

const fleet: FleetConfig = { fleetId: 'f', watchLimitTokens: 100_000, restSeconds: 60 };

function makeAgent(tokens: number): AgentState {
  return {
    agentId: 'a', fleetId: 'f', skills: [], status: 'working',
    currentWatchTokens: tokens, watchStartedAt: new Date(), restUntil: null,
    pairedWith: null, inputTokens: 0, outputTokens: 0, callCount: 0,
  };
}

describe('watchProgress', () => {
  it('returns 0 for 0 tokens', () => expect(watchProgress(makeAgent(0), fleet)).toBe(0));
  it('returns 50 for half limit', () => expect(watchProgress(makeAgent(50_000), fleet)).toBe(50));
  it('returns 100 at limit', () => expect(watchProgress(makeAgent(100_000), fleet)).toBe(100));
  it('caps at 100 over limit', () => expect(watchProgress(makeAgent(150_000), fleet)).toBe(100));
  it('returns 100 for zero-limit fleet', () => {
    expect(watchProgress(makeAgent(0), { ...fleet, watchLimitTokens: 0 })).toBe(100);
  });
});
