import { describe, it, expect } from 'vitest';
import { createClient } from '../index.js';
import { AnthropicClient } from '../anthropic-client.js';
import { OpenAIClient } from '../openai-client.js';
import { OpenRouterClient } from '../openrouter-client.js';

describe('createClient', () => {
  it('creates AnthropicClient for anthropic provider', () => {
    expect(createClient('anthropic')).toBeInstanceOf(AnthropicClient);
  });

  it('creates OpenAIClient for openai provider', () => {
    expect(createClient('openai')).toBeInstanceOf(OpenAIClient);
  });

  it('creates OpenRouterClient for openrouter provider', () => {
    expect(createClient('openrouter')).toBeInstanceOf(OpenRouterClient);
  });
});
