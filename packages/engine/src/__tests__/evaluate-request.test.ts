import { describe, it, expect } from 'vitest';
import { evaluateRequest } from '../evaluate-request.js';
import type { AgentState, FleetConfig, PairedAgentState } from '@whiteroom/shared';

function makeAgent(overrides: Partial<AgentState> = {}): AgentState {
  return {
    agentId: 'agent-1',
    fleetId: 'fleet-1',
    skills: [],
    status: 'working',
    currentWatchTokens: 0,
    watchStartedAt: new Date(),
    restUntil: null,
    pairedWith: null,
    inputTokens: 0,
    outputTokens: 0,
    callCount: 0,
    ...overrides,
  };
}

const fleet: FleetConfig = { fleetId: 'fleet-1', watchLimitTokens: 100_000, restSeconds: 60 };

describe('evaluateRequest', () => {
  it('allows request when agent is idle and starts new watch', () => {
    const result = evaluateRequest({
      agent: makeAgent({ status: 'idle' }),
      fleet,
      estimatedTokens: 1000,
      requestedModel: 'claude-sonnet-4-5',
    });
    expect(result.action).toBe('allow');
    expect(result.newAgentState?.status).toBe('working');
    expect(result.newAgentState?.currentWatchTokens).toBe(0);
  });

  it('allows request when agent is working and within limits', () => {
    const result = evaluateRequest({
      agent: makeAgent({ status: 'working', currentWatchTokens: 50_000 }),
      fleet,
      estimatedTokens: 1000,
      requestedModel: 'claude-sonnet-4-5',
    });
    expect(result.action).toBe('allow');
    expect(result.newAgentState).toBeUndefined();
  });

  it('compresses when tokens exceed watch limit', () => {
    const result = evaluateRequest({
      agent: makeAgent({ status: 'working', currentWatchTokens: 99_500 }),
      fleet,
      estimatedTokens: 1000,
      requestedModel: 'claude-sonnet-4-5',
    });
    expect(result.action).toBe('compress');
    expect(result.shouldGenerateHandover).toBe(true);
  });

  it('compresses at exact boundary', () => {
    const result = evaluateRequest({
      agent: makeAgent({ status: 'working', currentWatchTokens: 99_999 }),
      fleet,
      estimatedTokens: 2,
      requestedModel: 'claude-sonnet-4-5',
    });
    expect(result.action).toBe('compress');
  });

  it('allows at exact limit (not over)', () => {
    const result = evaluateRequest({
      agent: makeAgent({ status: 'working', currentWatchTokens: 99_999 }),
      fleet,
      estimatedTokens: 1,
      requestedModel: 'claude-sonnet-4-5',
    });
    expect(result.action).toBe('allow');
  });

  it('blocks when agent is resting and rest period not expired', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const restUntil = new Date('2026-01-01T12:01:00Z');
    const result = evaluateRequest({
      agent: makeAgent({ status: 'resting', restUntil }),
      fleet,
      estimatedTokens: 1000,
      requestedModel: 'claude-sonnet-4-5',
      now,
    });
    expect(result.action).toBe('block');
    expect(result.retryAfterSeconds).toBe(60);
  });

  it('allows when rest period expired and no paired agent', () => {
    const now = new Date('2026-01-01T12:02:00Z');
    const restUntil = new Date('2026-01-01T12:01:00Z');
    const result = evaluateRequest({
      agent: makeAgent({ status: 'resting', restUntil }),
      fleet,
      estimatedTokens: 1000,
      requestedModel: 'claude-sonnet-4-5',
      now,
    });
    expect(result.action).toBe('allow');
    expect(result.newAgentState?.status).toBe('working');
    expect(result.newAgentState?.currentWatchTokens).toBe(0);
  });

  it('blocks when rest expired but paired agent is still working (v1 bug #1 fix)', () => {
    const now = new Date('2026-01-01T12:02:00Z');
    const restUntil = new Date('2026-01-01T12:01:00Z');
    const pairedAgent: PairedAgentState = { agentId: 'agent-2', status: 'working' };
    const result = evaluateRequest({
      agent: makeAgent({ status: 'resting', restUntil, pairedWith: 'agent-2' }),
      fleet,
      estimatedTokens: 1000,
      requestedModel: 'claude-sonnet-4-5',
      pairedAgent,
      now,
    });
    expect(result.action).toBe('block');
  });

  it('allows when rest expired and paired agent is also resting', () => {
    const now = new Date('2026-01-01T12:02:00Z');
    const restUntil = new Date('2026-01-01T12:01:00Z');
    const pairedAgent: PairedAgentState = { agentId: 'agent-2', status: 'resting' };
    const result = evaluateRequest({
      agent: makeAgent({ status: 'resting', restUntil, pairedWith: 'agent-2' }),
      fleet,
      estimatedTokens: 1000,
      requestedModel: 'claude-sonnet-4-5',
      pairedAgent,
      now,
    });
    expect(result.action).toBe('allow');
  });

  it('reroutes simple task with expensive model', () => {
    const result = evaluateRequest({
      agent: makeAgent({ status: 'working', currentWatchTokens: 1000 }),
      fleet,
      estimatedTokens: 500,
      taskTier: 'simple',
      requestedModel: 'claude-opus-4-7',
    });
    expect(result.action).toBe('reroute');
    expect(result.suggestedModel).toBe('claude-haiku-4-5');
  });

  it('does not reroute when model matches tier', () => {
    const result = evaluateRequest({
      agent: makeAgent({ status: 'working', currentWatchTokens: 1000 }),
      fleet,
      estimatedTokens: 500,
      taskTier: 'simple',
      requestedModel: 'claude-haiku-4-5',
    });
    expect(result.action).toBe('allow');
  });

  it('reroutes complex task with cheap model', () => {
    const result = evaluateRequest({
      agent: makeAgent({ status: 'working', currentWatchTokens: 1000 }),
      fleet,
      estimatedTokens: 500,
      taskTier: 'complex',
      requestedModel: 'claude-haiku-4-5',
    });
    expect(result.action).toBe('reroute');
    expect(result.suggestedModel).toBe('claude-opus-4-7');
  });
});
