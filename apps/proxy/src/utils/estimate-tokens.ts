export function estimateTokens(body: Record<string, unknown>): number {
  const messages = body.messages as Array<{ content?: string }> | undefined;
  if (!messages) return 0;
  let chars = 0;
  for (const m of messages) {
    if (typeof m.content === 'string') chars += m.content.length;
  }
  return Math.ceil(chars / 4);
}
