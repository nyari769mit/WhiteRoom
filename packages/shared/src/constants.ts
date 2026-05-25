import type { EventType } from './types.js';

export const EVENT_TYPES: Record<string, EventType> = {
  AGENT_REGISTERED: 'agent.registered',
  AGENT_REQUEST: 'agent.request',
  AGENT_RESPONSE: 'agent.response',
  WATCH_STARTED: 'watch.started',
  WATCH_LIMIT_HIT: 'watch.limit_hit',
  WATCH_COMPLETED: 'watch.completed',
  HANDOVER_GENERATED: 'handover.generated',
  HANDOVER_INJECTED: 'handover.injected',
  AGENT_RESTING: 'agent.resting',
  AGENT_ALARM_FIRED: 'agent.alarm_fired',
  ROUTING_DECISION: 'routing.decision',
  COMPRESSION_APPLIED: 'compression.applied',
  ERROR: 'error',
} as const;

export const DEFAULT_WATCH_LIMIT_TOKENS = 100_000;
export const DEFAULT_REST_SECONDS = 60;
export const TRIAL_TTL_HOURS = 24;
export const TRIAL_TOKEN_LENGTH = 6;
export const TRIAL_TOKEN_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
export const API_KEY_PREFIX = 'wr_';
export const MAX_TASKS_FOR_COMPRESSION = 20;
export const COMPRESSION_MAX_TOKENS = 500;
export const ALARM_CHECK_INTERVAL_MS = 30_000;
