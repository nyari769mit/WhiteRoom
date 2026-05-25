import Anthropic from '@anthropic-ai/sdk';
import type { LLMClient, LLMRequest, LLMResponse, LLMMessage } from './types.js';
import { injectHandover } from './handover.js';

export class AnthropicClient implements LLMClient {
  readonly provider = 'anthropic' as const;

  async sendRequest(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
    const client = new Anthropic({ apiKey });

    const systemMessages = request.messages.filter((m) => m.role === 'system');
    const nonSystemMessages = request.messages.filter((m) => m.role !== 'system');

    const response = await client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature,
      system: systemMessages.map((m) => m.content).join('\n\n') || undefined,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');

    return {
      content: textBlock?.text ?? '',
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      raw: response,
    };
  }

  injectHandover(messages: LLMMessage[], handoverDoc: string): LLMMessage[] {
    return injectHandover(messages, handoverDoc);
  }
}
