export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: LLMUsage;
  raw: unknown;
}

export type LLMProvider = 'anthropic' | 'openai' | 'openrouter';

export interface LLMClient {
  readonly provider: LLMProvider;
  sendRequest(request: LLMRequest, apiKey: string): Promise<LLMResponse>;
  injectHandover(messages: LLMMessage[], handoverDoc: string): LLMMessage[];
}
