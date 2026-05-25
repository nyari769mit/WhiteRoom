import { describe, it, expect } from 'vitest';
import { injectHandover } from '../handover.js';
import type { LLMMessage } from '../types.js';

describe('injectHandover', () => {
  it('prepends handover as first user message', () => {
    const messages: LLMMessage[] = [
      { role: 'user', content: 'Hello' },
    ];
    const result = injectHandover(messages, '{"decisions":[]}');
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('user');
    expect(result[0].content).toContain('[HANDOVER CONTEXT]');
    expect(result[0].content).toContain('{"decisions":[]}');
  });

  it('preserves original messages unchanged', () => {
    const messages: LLMMessage[] = [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hi' },
    ];
    const result = injectHandover(messages, 'doc');
    expect(result).toHaveLength(3);
    expect(result[1]).toEqual(messages[0]);
    expect(result[2]).toEqual(messages[1]);
  });

  it('works with empty message array', () => {
    const result = injectHandover([], 'context');
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('[HANDOVER CONTEXT]\ncontext');
  });
});
