# @whiteroom/llm-clients

LLM provider clients with handover injection for WhiteRoom governance.

## Install

```bash
npm install @whiteroom/llm-clients @whiteroom/shared
```

## Usage

```typescript
import { createClient, detectProviderFromModel, injectHandover } from '@whiteroom/llm-clients';

const client = createClient('anthropic');
const response = await client.sendRequest(
  { model: 'claude-sonnet-4-5', messages: [{ role: 'user', content: 'Hello' }] },
  'sk-ant-...',
);
```

## Supported Providers

| Provider | Client | Detection |
|----------|--------|-----------|
| Anthropic | `AnthropicClient` | `claude-*` models |
| OpenAI | `OpenAIClient` | `gpt-*`, `o1*`, `o3*` models |
| OpenRouter | `OpenRouterClient` | All other models |

## License

BSL 1.1 — converts to Apache 2.0 after 4 years.
