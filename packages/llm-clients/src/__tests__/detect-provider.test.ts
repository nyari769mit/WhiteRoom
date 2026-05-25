import { describe, it, expect } from 'vitest';
import { detectProvider, detectProviderFromModel } from '../detect-provider.js';

describe('detectProvider', () => {
  it('detects anthropic from hostname', () => {
    expect(detectProvider('api.anthropic.com')).toBe('anthropic');
  });

  it('detects openai from hostname', () => {
    expect(detectProvider('api.openai.com')).toBe('openai');
  });

  it('detects openrouter from hostname', () => {
    expect(detectProvider('openrouter.ai')).toBe('openrouter');
  });

  it('returns null for unknown hostname', () => {
    expect(detectProvider('api.example.com')).toBeNull();
  });
});

describe('detectProviderFromModel', () => {
  it('detects anthropic from claude model', () => {
    expect(detectProviderFromModel('claude-opus-4-7')).toBe('anthropic');
  });

  it('detects openai from gpt model', () => {
    expect(detectProviderFromModel('gpt-4o')).toBe('openai');
  });

  it('detects openai from o1/o3 model', () => {
    expect(detectProviderFromModel('o1-preview')).toBe('openai');
    expect(detectProviderFromModel('o3-mini')).toBe('openai');
  });

  it('falls back to openrouter for unknown model', () => {
    expect(detectProviderFromModel('llama-3-70b')).toBe('openrouter');
  });
});
