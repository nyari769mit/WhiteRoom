import { describe, it, expect } from 'vitest';
import { selectModelForTier } from '../model-routing.js';

describe('selectModelForTier', () => {
  it('downgrades opus to haiku for simple tasks', () => {
    const result = selectModelForTier('claude-opus-4-7', 'simple');
    expect(result.rerouted).toBe(true);
    expect(result.model).toBe('claude-haiku-4-5');
  });

  it('downgrades gpt-4o to haiku for simple tasks', () => {
    const result = selectModelForTier('gpt-4o', 'simple');
    expect(result.rerouted).toBe(true);
    expect(result.model).toBe('claude-haiku-4-5');
  });

  it('upgrades haiku to opus for complex tasks', () => {
    const result = selectModelForTier('claude-haiku-4-5', 'complex');
    expect(result.rerouted).toBe(true);
    expect(result.model).toBe('claude-opus-4-7');
  });

  it('keeps model for standard tier', () => {
    const result = selectModelForTier('claude-sonnet-4-5', 'standard');
    expect(result.rerouted).toBe(false);
    expect(result.model).toBe('claude-sonnet-4-5');
  });

  it('keeps haiku for simple tasks (already cheap)', () => {
    const result = selectModelForTier('claude-haiku-4-5', 'simple');
    expect(result.rerouted).toBe(false);
    expect(result.model).toBe('claude-haiku-4-5');
  });

  it('keeps opus for complex tasks (already powerful)', () => {
    const result = selectModelForTier('claude-opus-4-7', 'complex');
    expect(result.rerouted).toBe(false);
    expect(result.model).toBe('claude-opus-4-7');
  });

  it('keeps unknown model for any tier', () => {
    const result = selectModelForTier('custom-model', 'simple');
    expect(result.rerouted).toBe(false);
    expect(result.model).toBe('custom-model');
  });
});
