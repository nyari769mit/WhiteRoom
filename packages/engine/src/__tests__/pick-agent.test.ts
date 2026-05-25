import { describe, it, expect } from 'vitest';
import { pickAgentForTask } from '../pick-agent.js';
import type { AgentState } from '@whiteroom/shared';

function makeAgent(id: string, overrides: Partial<AgentState> = {}): AgentState {
  return {
    agentId: id,
    fleetId: 'fleet-1',
    skills: [],
    status: 'idle',
    currentWatchTokens: 0,
    watchStartedAt: null,
    restUntil: null,
    pairedWith: null,
    inputTokens: 0,
    outputTokens: 0,
    callCount: 0,
    ...overrides,
  };
}

describe('pickAgentForTask', () => {
  it('returns null when no candidates', () => {
    const result = pickAgentForTask({ candidates: [], requiredSkills: [], taskTier: 'standard' });
    expect(result).toBeNull();
  });

  it('returns null when no agents have required skills', () => {
    const result = pickAgentForTask({
      candidates: [makeAgent('a', { skills: ['writing'] })],
      requiredSkills: ['research'],
      taskTier: 'standard',
    });
    expect(result).toBeNull();
  });

  it('picks agent with matching skills', () => {
    const result = pickAgentForTask({
      candidates: [
        makeAgent('a', { skills: ['writing'] }),
        makeAgent('b', { skills: ['research', 'writing'] }),
      ],
      requiredSkills: ['research'],
      taskTier: 'standard',
    });
    expect(result?.agentId).toBe('b');
  });

  it('prefers idle agent over working agent', () => {
    const result = pickAgentForTask({
      candidates: [
        makeAgent('a', { status: 'working', currentWatchTokens: 1000 }),
        makeAgent('b', { status: 'idle' }),
      ],
      requiredSkills: [],
      taskTier: 'standard',
    });
    expect(result?.agentId).toBe('b');
  });

  it('prefers lower utilization when both working', () => {
    const result = pickAgentForTask({
      candidates: [
        makeAgent('a', { status: 'working', currentWatchTokens: 50_000 }),
        makeAgent('b', { status: 'working', currentWatchTokens: 10_000 }),
      ],
      requiredSkills: [],
      taskTier: 'standard',
    });
    expect(result?.agentId).toBe('b');
  });

  it('excludes resting agents', () => {
    const result = pickAgentForTask({
      candidates: [
        makeAgent('a', { status: 'resting' }),
        makeAgent('b', { status: 'working', currentWatchTokens: 5000 }),
      ],
      requiredSkills: [],
      taskTier: 'standard',
    });
    expect(result?.agentId).toBe('b');
  });

  it('works with no required skills (any agent matches)', () => {
    const result = pickAgentForTask({
      candidates: [makeAgent('a')],
      requiredSkills: [],
      taskTier: 'standard',
    });
    expect(result?.agentId).toBe('a');
  });
});
