import { describe, it, expect } from 'vitest';
import { agentHealth } from '../agent-health.js';
import type { AgentState, FleetConfig } from '@whiteroom/shared';

const fleet: FleetConfig = { fleetId: 'f', watchLimitTokens: 100_000, restSeconds: 60 };

function makeAgent(overrides: Partial<AgentState> = {}): AgentState {
  return {
    agentId: 'a', fleetId: 'f', skills: [], status: 'idle',
    currentWatchTokens: 0, watchStartedAt: null, restUntil: null,
    pairedWith: null, inputTokens: 0, outputTokens: 0, callCount: 0,
    ...overrides,
  };
}

describe('agentHealth', () => {
  it('returns 100 for idle agent', () => {
    expect(agentHealth(makeAgent({ status: 'idle' }), fleet)).toBe(100);
  });

  it('returns 100 for working agent at 0 tokens', () => {
    expect(agentHealth(makeAgent({ status: 'working', currentWatchTokens: 0 }), fleet)).toBe(100);
  });

  it('decreases health as watch progresses', () => {
    const health = agentHealth(makeAgent({ status: 'working', currentWatchTokens: 80_000 }), fleet);
    expect(health).toBeLessThan(50);
    expect(health).toBeGreaterThanOrEqual(20);
  });

  it('never goes below 20 for working agent', () => {
    const health = agentHealth(makeAgent({ status: 'working', currentWatchTokens: 200_000 }), fleet);
    expect(health).toBe(20);
  });

  it('recovers during rest period', () => {
    const restUntil = new Date(Date.now() + 30_000);
    const health = agentHealth(makeAgent({ status: 'resting', restUntil }), fleet);
    expect(health).toBeGreaterThan(25);
    expect(health).toBeLessThanOrEqual(100);
  });
});
