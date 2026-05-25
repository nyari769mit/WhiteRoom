'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEEvent {
  id: string;
  eventType: string;
  agentId?: string;
  payload?: Record<string, unknown>;
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
  costCents?: number;
  createdAt: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:8080';

const EVENT_TYPES = [
  'agent.registered',
  'agent.request',
  'agent.response',
  'watch.started',
  'watch.limit_hit',
  'watch.completed',
  'handover.generated',
  'handover.injected',
  'agent.resting',
  'agent.alarm_fired',
  'routing.decision',
  'compression.applied',
  'error',
] as const;

export function useSSE(slug: string | null) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const retryRef = useRef(0);
  const sourceRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!slug) return;

    sourceRef.current?.close();

    const url = `${PROXY_URL}/api/workspaces/${slug}/events/stream`;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => {
      setStatus('connected');
      retryRef.current = 0;
    };

    source.onerror = () => {
      source.close();
      sourceRef.current = null;
      setStatus('disconnected');
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
      retryRef.current++;
      retryTimerRef.current = setTimeout(connect, delay);
    };

    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as SSEEvent;
        setEvents((prev) => [data, ...prev].slice(0, 200));
      } catch { /* malformed SSE data */ }
    };

    for (const type of EVENT_TYPES) {
      source.addEventListener(type, handler);
    }
  }, [slug]);

  useEffect(() => {
    connect();
    return () => {
      sourceRef.current?.close();
      sourceRef.current = null;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [connect]);

  return { events, status };
}
