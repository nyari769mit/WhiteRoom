import OpenAI from 'openai';
import type { LLMClient, LLMRequest, LLMResponse, LLMMessage } from './types.js';
import { injectHandover } from './handover.js';

export class OpenAIClient implements LLMClient {
  readonly provider = 'openai' as const;

  async sendRequest(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const choice = response.choices[0];

    return {
      content: choice?.message?.content ?? '',
      model: response.model,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
      raw: response,
    };
  }

  injectHandover(messages: LLMMessage[], handoverDoc: string): LLMMessage[] {
    return injectHandover(messages, handoverDoc);
  }
}
