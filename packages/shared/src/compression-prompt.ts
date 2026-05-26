import type { TaskSummary } from './types.js';
import { MAX_TASKS_FOR_COMPRESSION } from './constants.js';

export const COMPRESSION_SYSTEM_PROMPT = `You are summarizing an AI agent work session for handover.
From the task history below, extract ONLY:
- DECISIONS: irreversible choices made and why
- STATE: what exists now as a result of this work
- PENDING: what still needs doing, in priority order
- WARNINGS: what the next session must not ignore

Be ruthlessly concise. Every word costs tokens.
Output valid JSON only — no preamble, no markdown.`;

/** Builds the LLM messages array for handover compression from the last 20 tasks. */
export function buildCompressionMessages(
  taskHistory: TaskSummary[],
): Array<{ role: 'user'; content: string }> {
  const recentTasks = taskHistory.slice(-MAX_TASKS_FOR_COMPRESSION);
  return [
    {
      role: 'user' as const,
      content: `Task history: ${JSON.stringify(recentTasks)}`,
    },
  ];
}
