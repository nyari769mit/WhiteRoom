import { describe, it, expect } from 'vitest';
import { shouldFireAlarm } from '../should-fire-alarm.js';
import type { AgentState, PairedAgentState } from '@whiteroom/shared';

function makeAgent(overrides: Partial<AgentState> = {}): AgentState {
  return {
    agentId: 'agent-1',
    fleetId: 'fleet-1',
    skills: [],
    status: 'resting',
    currentWatchTokens: 0,
    watchStartedAt: null,
    restUntil: new Date('2026-01-01T12:00:00Z'),
    pairedWith: null,
    inputTokens: 0,
    outputTokens: 0,
    callCount: 0,
    ...overrides,
  };
}

describe('shouldFireAlarm', () => {
  it('fires when resting, rest expired, no paired agent', () => {
    const result = shouldFireAlarm({
      agent: makeAgent(),
      now: new Date('2026-01-01T12:01:00Z'),
    });
    expect(result).toBe(true);
  });

  it('does NOT fire when rest period has not expired', () => {
    const result = shouldFireAlarm({
      agent: makeAgent(),
      now: new Date('2026-01-01T11:59:00Z'),
    });
    expect(result).toBe(false);
  });

  it('does NOT fire when agent is not resting', () => {
    const result = shouldFireAlarm({
      agent: makeAgent({ status: 'working' }),
      now: new Date('2026-01-01T12:01:00Z'),
    });
    expect(result).toBe(false);
  });

  it('does NOT fire when paired agent is working (v1 bug #1 fix)', () => {
    const paired: PairedAgentState = { agentId: 'agent-2', status: 'working' };
    const result = shouldFireAlarm({
      agent: makeAgent({ pairedWith: 'agent-2' }),
      pairedAgent: paired,
      now: new Date('2026-01-01T12:01:00Z'),
    });
    expect(result).toBe(false);
  });

  it('fires when paired agent is resting', () => {
    const paired: PairedAgentState = { agentId: 'agent-2', status: 'resting' };
    const result = shouldFireAlarm({
      agent: makeAgent({ pairedWith: 'agent-2' }),
      pairedAgent: paired,
      now: new Date('2026-01-01T12:01:00Z'),
    });
    expect(result).toBe(true);
  });

  it('fires when paired agent is idle', () => {
    const paired: PairedAgentState = { agentId: 'agent-2', status: 'idle' };
    const result = shouldFireAlarm({
      agent: makeAgent({ pairedWith: 'agent-2' }),
      pairedAgent: paired,
      now: new Date('2026-01-01T12:01:00Z'),
    });
    expect(result).toBe(true);
  });

  it('does NOT fire when restUntil is null', () => {
    const result = shouldFireAlarm({
      agent: makeAgent({ restUntil: null }),
      now: new Date('2026-01-01T12:01:00Z'),
    });
    expect(result).toBe(false);
  });
});
