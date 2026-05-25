import { eq, desc, auditEvents, handoverDocuments, agents } from '@whiteroom/db';
import type { DbClient } from '@whiteroom/db';
import { generateId, buildCompressionMessages, COMPRESSION_SYSTEM_PROMPT } from '@whiteroom/shared';
import type { TaskSummary } from '@whiteroom/shared';
import { createClient, detectProviderFromModel } from '@whiteroom/llm-clients';

interface GenerateHandoverParams {
  db: DbClient;
  fleetId: string;
  agentId: string;
  workspaceId: string;
  restSeconds: number;
  llmApiKey: string;
  model: string;
}

export async function generateHandover(params: GenerateHandoverParams): Promise<string> {
  const { db, fleetId, agentId, workspaceId, restSeconds, llmApiKey, model } = params;

  const recentEvents = await db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.agentId, agentId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(20);

  const taskHistory: TaskSummary[] = recentEvents
    .filter((e) => e.eventType === 'agent.response')
    .map((e) => ({
      taskName: (e.payload as Record<string, string>)?.task || 'unknown',
      tokensUsed: (e.tokensIn ?? 0) + (e.tokensOut ?? 0),
      completedAt: e.createdAt.toISOString(),
    }));

  const provider = detectProviderFromModel(model);
  const client = createClient(provider);

  const compressionMessages = buildCompressionMessages(taskHistory);
  const response = await client.sendRequest(
    {
      model,
      messages: [
        { role: 'system', content: COMPRESSION_SYSTEM_PROMPT },
        ...compressionMessages,
      ],
      maxTokens: 500,
      temperature: 0,
    },
    llmApiKey,
  );

  const handoverId = generateId();
  await db.insert(handoverDocuments).values({
    id: handoverId,
    fleetId,
    fromAgentId: agentId,
    document: response.content,
    tokensUsed: response.usage.inputTokens + response.usage.outputTokens,
  });

  const restUntil = new Date(Date.now() + restSeconds * 1000);
  await db
    .update(agents)
    .set({ status: 'resting', restUntil, currentWatchTokens: 0, watchStartedAt: null })
    .where(eq(agents.id, agentId));

  return handoverId;
}

export async function getLatestHandover(
  db: DbClient,
  agentId: string,
): Promise<string | null> {
  const [doc] = await db
    .select()
    .from(handoverDocuments)
    .where(eq(handoverDocuments.fromAgentId, agentId))
    .orderBy(desc(handoverDocuments.createdAt))
    .limit(1);

  if (!doc) return null;
  return typeof doc.document === 'string' ? doc.document : JSON.stringify(doc.document);
}
