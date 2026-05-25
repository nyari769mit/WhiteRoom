export type AgentStatus = 'idle' | 'working' | 'resting';

export type Tier = 'trial' | 'pro' | 'enterprise';

export type TaskTier = 'simple' | 'standard' | 'complex';

export type EventType =
  | 'agent.registered'
  | 'agent.request'
  | 'agent.response'
  | 'watch.started'
  | 'watch.limit_hit'
  | 'watch.completed'
  | 'handover.generated'
  | 'handover.injected'
  | 'agent.resting'
  | 'agent.alarm_fired'
  | 'routing.decision'
  | 'compression.applied'
  | 'error';

export interface AgentState {
  agentId: string;
  fleetId: string;
  skills: string[];
  status: AgentStatus;
  currentWatchTokens: number;
  watchStartedAt: Date | null;
  restUntil: Date | null;
  pairedWith: string | null;
  inputTokens: number;
  outputTokens: number;
  callCount: number;
}

export interface FleetConfig {
  fleetId: string;
  watchLimitTokens: number;
  restSeconds: number;
}

export interface PairedAgentState {
  agentId: string;
  status: AgentStatus;
}

export interface GovernanceDecision {
  action: 'allow' | 'compress' | 'block' | 'reroute';
  reason: string;
  suggestedModel?: string;
  shouldGenerateHandover?: boolean;
  retryAfterSeconds?: number;
  newAgentState?: Partial<AgentState>;
}

export interface HandoverDecision {
  what: string;
  why: string;
  final: boolean;
}

export interface HandoverPending {
  task: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
}

export interface HandoverDocument {
  decisions: HandoverDecision[];
  state: string;
  pending: HandoverPending[];
  warnings: string[];
  generated_at: string;
  watch_summary: {
    tasks_completed: number;
    tokens_used: number;
    duration_minutes: number;
  };
}

export interface TaskSummary {
  taskName: string;
  tokensUsed: number;
  completedAt: string;
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  fleetId: string | null;
  agentId: string | null;
  eventType: EventType;
  payload: Record<string, unknown> | null;
  tokensIn: number | null;
  tokensOut: number | null;
  model: string | null;
  costCents: number | null;
  createdAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string | null;
  tier: Tier;
  isEphemeral: boolean;
  trialToken: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}
