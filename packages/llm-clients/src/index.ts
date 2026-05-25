export type { LLMClient, LLMRequest, LLMResponse, LLMMessage, LLMUsage, LLMProvider } from './types.js';
export { AnthropicClient } from './anthropic-client.js';
export { OpenAIClient } from './openai-client.js';
export { OpenRouterClient } from './openrouter-client.js';
export { detectProvider, detectProviderFromModel } from './detect-provider.js';
export { injectHandover } from './handover.js';

import type { LLMClient, LLMProvider } from './types.js';
import { AnthropicClient } from './anthropic-client.js';
import { OpenAIClient } from './openai-client.js';
import { OpenRouterClient } from './openrouter-client.js';

export function createClient(provider: LLMProvider): LLMClient {
  switch (provider) {
    case 'anthropic':
      return new AnthropicClient();
    case 'openai':
      return new OpenAIClient();
    case 'openrouter':
      return new OpenRouterClient();
  }
}
