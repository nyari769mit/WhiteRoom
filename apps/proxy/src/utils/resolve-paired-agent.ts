import { eq, or, and, agents, agentPairs } from '@whiteroom/db';
import type { DbClient } from '@whiteroom/db';
import type { PairedAgentState, AgentState } from '@whiteroom/shared';

export async function resolvePairedAgent(
  db: DbClient,
  agentId: string,
  fleetId: string,
  pairedWith: string | null,
): Promise<PairedAgentState | undefined> {
  let partnerId: string | undefined;

  if (pairedWith) {
    partnerId = pairedWith;
  } else {
    const [pair] = await db
      .select()
      .from(agentPairs)
      .where(
        and(
          eq(agentPairs.fleetId, fleetId),
          or(eq(agentPairs.agentIdA, agentId), eq(agentPairs.agentIdB, agentId)),
        ),
      )
      .limit(1);

    if (pair) {
      partnerId = pair.agentIdA === agentId ? pair.agentIdB : pair.agentIdA;
    }
  }

  if (!partnerId) return undefined;

  const [partner] = await db
    .select({ agentId: agents.id, status: agents.status })
    .from(agents)
    .where(eq(agents.id, partnerId))
    .limit(1);

  if (!partner) return undefined;
  return { agentId: partner.agentId, status: partner.status as AgentState['status'] };
}
