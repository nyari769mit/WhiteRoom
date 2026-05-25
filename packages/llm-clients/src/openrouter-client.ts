import type { LLMClient, LLMRequest, LLMResponse, LLMMessage } from './types.js';
import { injectHandover } from './handover.js';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export class OpenRouterClient implements LLMClient {
  readonly provider = 'openrouter' as const;

  async sendRequest(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://whiteroom.tech',
        'X-Title': 'WhiteRoom',
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const choice = data.choices[0];

    return {
      content: choice?.message?.content ?? '',
      model: data.model,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
      raw: data,
    };
  }

  injectHandover(messages: LLMMessage[], handoverDoc: string): LLMMessage[] {
    return injectHandover(messages, handoverDoc);
  }
}
