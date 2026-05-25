import { eq, and, lte, agents } from '@whiteroom/db';
import type { DbClient } from '@whiteroom/db';
import { shouldFireAlarm } from '@whiteroom/engine';
import type { AgentState } from '@whiteroom/shared';
import { ALARM_CHECK_INTERVAL_MS } from '@whiteroom/shared';
import { resolvePairedAgent } from '../utils/resolve-paired-agent.js';

export function startAlarmChecker(db: DbClient) {
  const interval = setInterval(async () => {
    try {
      await checkAlarms(db);
    } catch (err) {
      console.error('Alarm checker error:', err);
    }
  }, ALARM_CHECK_INTERVAL_MS);

  return () => clearInterval(interval);
}

async function checkAlarms(db: DbClient) {
  const now = new Date();

  const restingAgents = await db
    .select()
    .from(agents)
    .where(and(eq(agents.status, 'resting'), lte(agents.restUntil, now)));

  const wakeIds: string[] = [];

  for (const agent of restingAgents) {
    const pairedAgent = await resolvePairedAgent(db, agent.id, agent.fleetId, agent.pairedWith);

    const agentState: AgentState = {
      agentId: agent.id,
      fleetId: agent.fleetId,
      skills: agent.skills as string[],
      status: agent.status as AgentState['status'],
      currentWatchTokens: agent.currentWatchTokens,
      watchStartedAt: agent.watchStartedAt,
      restUntil: agent.restUntil,
      pairedWith: agent.pairedWith,
      inputTokens: agent.inputTokens,
      outputTokens: agent.outputTokens,
      callCount: agent.callCount,
    };

    if (shouldFireAlarm({ agent: agentState, pairedAgent, now })) {
      wakeIds.push(agent.id);
    }
  }

  for (const id of wakeIds) {
    await db
      .update(agents)
      .set({ status: 'idle', restUntil: null, currentWatchTokens: 0, watchStartedAt: null })
      .where(eq(agents.id, id));
  }
}
