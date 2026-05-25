import type { LLMMessage } from './types.js';

const HANDOVER_PREFIX = '[HANDOVER CONTEXT]\n';

export function injectHandover(messages: LLMMessage[], handoverDoc: string): LLMMessage[] {
  const handoverMessage: LLMMessage = {
    role: 'user',
    content: HANDOVER_PREFIX + handoverDoc,
  };
  return [handoverMessage, ...messages];
}
