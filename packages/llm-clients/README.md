# @whiteroom/llm-clients

[![npm version](https://img.shields.io/npm/v/@whiteroom/llm-clients)](https://www.npmjs.com/package/@whiteroom/llm-clients)
[![License: BSL 1.1](https://img.shields.io/badge/license-BSL%201.1-blue)](https://github.com/guideage/whiteroom/blob/main/LICENSE)

LLM provider clients with handover injection for WhiteRoom governance. Wraps the Anthropic, OpenAI, and OpenRouter SDKs with a uniform interface.

## Install

```bash
npm install @whiteroom/llm-clients @whiteroom/shared
```

## Quick Start

```typescript
import { createClient, detectProviderFromModel } from '@whiteroom/llm-clients';

// Auto-detect provider from model name
const provider = detectProviderFromModel('claude-sonnet-4-5'); // 'anthropic'
const client = createClient(provider);

// Send a request
const response = await client.sendRequest(
  {
    model: 'claude-sonnet-4-5',
    messages: [{ role: 'user', content: 'Summarize this document.' }],
    max_tokens: 1024,
  },
  'sk-ant-your-api-key',
);

console.log(response.content);    // LLM response text
console.log(response.usage);      // { inputTokens, outputTokens }
console.log(response.costCents);  // estimated cost
```

## Handover Injection

When an agent resumes after rest, inject the handover document as context:

```typescript
import { injectHandover } from '@whiteroom/llm-clients';
import type { HandoverDocument } from '@whiteroom/shared';

const handover: HandoverDocument = {
  decisions: [{ what: 'Chose PostgreSQL', why: 'Team expertise', final: true }],
  state: 'Database schema defined, migrations pending',
  pending: [{ task: 'Run migrations', priority: 'HIGH' }],
  warnings: ['Do not drop the users table'],
  generated_at: new Date().toISOString(),
  watch_summary: { tasks_completed: 10, tokens_used: 6060, duration_minutes: 10 },
};

const messages = [{ role: 'user' as const, content: 'Continue the migration work.' }];
const withHandover = injectHandover(messages, handover);
// Prepends handover context as the first message
```

## Supported Providers

| Provider | Client | Auto-detected models |
|----------|--------|---------------------|
| Anthropic | `AnthropicClient` | `claude-*` |
| OpenAI | `OpenAIClient` | `gpt-*`, `o1*`, `o3*` |
| OpenRouter | `OpenRouterClient` | Everything else |

## API

### `createClient(provider)` -> `LLMClient`

Creates a client for the given provider (`'anthropic'`, `'openai'`, or `'openrouter'`).

### `detectProviderFromModel(model)` -> `LLMProvider`

Returns the provider for a given model name.

### `detectProvider(baseUrl)` -> `LLMProvider`

Returns the provider based on a base URL (e.g., `api.anthropic.com` -> `'anthropic'`).

### `injectHandover(messages, handover)` -> `LLMMessage[]`

Prepends a handover document as context to a message array.

### `LLMClient` interface

```typescript
interface LLMClient {
  sendRequest(request: LLMRequest, apiKey: string): Promise<LLMResponse>;
}

interface LLMResponse {
  content: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
  costCents: number;
  raw: unknown;  // original provider response
}
```

## License

[BSL 1.1](https://github.com/guideage/whiteroom/blob/main/LICENSE) -- converts to Apache 2.0 after 4 years.

Built by [Guideage](https://guideage.ai).
