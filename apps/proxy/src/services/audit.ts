import { auditEvents } from '@whiteroom/db';
import type { DbClient } from '@whiteroom/db';
import { generateId } from '@whiteroom/shared';
import type { EventType } from '@whiteroom/shared';
import { emitEvent } from './events.js';

interface AuditParams {
  db: DbClient;
  workspaceId: string;
  fleetId?: string;
  agentId?: string;
  eventType: EventType;
  payload?: Record<string, unknown>;
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
  costCents?: number;
}

export async function writeAuditEvent(params: AuditParams): Promise<string> {
  const id = generateId();
  const event = {
    id,
    workspaceId: params.workspaceId,
    fleetId: params.fleetId ?? null,
    agentId: params.agentId ?? null,
    eventType: params.eventType,
    payload: params.payload ?? null,
    tokensIn: params.tokensIn ?? null,
    tokensOut: params.tokensOut ?? null,
    model: params.model ?? null,
    costCents: params.costCents ?? null,
  };

  await params.db.insert(auditEvents).values(event);

  emitEvent(params.workspaceId, {
    id,
    eventType: params.eventType,
    agentId: params.agentId,
    payload: params.payload,
    tokensIn: params.tokensIn,
    tokensOut: params.tokensOut,
    model: params.model,
    costCents: params.costCents,
    createdAt: new Date().toISOString(),
  });

  return id;
}
