import type { LLMProvider } from './types.js';

const PROVIDER_PATTERNS: Array<{ pattern: RegExp; provider: LLMProvider }> = [
  { pattern: /anthropic/i, provider: 'anthropic' },
  { pattern: /openrouter/i, provider: 'openrouter' },
  { pattern: /openai/i, provider: 'openai' },
];

export function detectProvider(hostname: string): LLMProvider | null {
  for (const { pattern, provider } of PROVIDER_PATTERNS) {
    if (pattern.test(hostname)) return provider;
  }
  return null;
}

export function detectProviderFromModel(model: string): LLMProvider {
  if (model.startsWith('claude-') || model.startsWith('anthropic/')) return 'anthropic';
  if (model.startsWith('gpt-') || model.startsWith('o1') || model.startsWith('o3')) return 'openai';
  return 'openrouter';
}
