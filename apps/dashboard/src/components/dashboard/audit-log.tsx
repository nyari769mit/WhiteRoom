'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SSEEvent } from '@/hooks/use-sse';

const EVENT_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  'agent.response': { color: 'text-accent-blue', bg: 'bg-accent-blue/10', border: 'border-accent-blue/20' },
  'routing.decision': { color: 'text-navy-400', bg: 'bg-navy-800', border: 'border-navy-700' },
  'handover.generated': { color: 'text-accent-green', bg: 'bg-accent-green/10', border: 'border-accent-green/20' },
  'handover.injected': { color: 'text-accent-green', bg: 'bg-accent-green/10', border: 'border-accent-green/20' },
  'watch.limit_hit': { color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  'agent.resting': { color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  'agent.alarm_fired': { color: 'text-accent-red', bg: 'bg-accent-red/10', border: 'border-accent-red/20' },
  'error': { color: 'text-accent-red', bg: 'bg-accent-red/10', border: 'border-accent-red/20' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  return `${Math.floor(diff / 3_600_000)}h`;
}

interface AuditLogProps {
  events: SSEEvent[];
}

export function AuditLog({ events }: AuditLogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-xl glass-card overflow-hidden">
      <div className="px-5 py-3 border-b border-accent-green/10 flex items-center justify-between">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-navy-200">Audit Log</h3>
        {events.length > 0 && (
          <span className="text-[10px] text-accent-green/50 font-mono">{events.length} events</span>
        )}
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {events.slice(0, 50).map((event) => {
            const style = EVENT_STYLES[event.eventType] || { color: 'text-navy-400', bg: 'bg-navy-800', border: 'border-navy-700' };
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-accent-green/5 last:border-0"
              >
                <button
                  onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-accent-green/[0.02] transition-colors duration-150 cursor-pointer"
                >
                  {expandedId === event.id ? (
                    <ChevronDown className="h-3 w-3 text-accent-green/50 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-navy-600 shrink-0" />
                  )}
                  <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded border', style.color, style.bg, style.border)}>
                    {event.eventType}
                  </span>
                  {event.agentId && (
                    <span className="text-[10px] text-navy-600 font-mono truncate max-w-[100px]">
                      {event.agentId}
                    </span>
                  )}
                  <span className="text-[10px] text-navy-700 font-mono ml-auto shrink-0">
                    {timeAgo(event.createdAt)}
                  </span>
                </button>

                <AnimatePresence>
                  {expandedId === event.id && event.payload && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-3"
                    >
                      <pre className="text-xs text-accent-green/60 font-mono bg-navy-950 rounded-lg p-3 overflow-x-auto border border-accent-green/10">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {events.length === 0 && (
          <div className="px-5 py-12 text-center">
            <div className="relative h-10 w-10 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full border border-accent-green/20" />
              <div className="absolute inset-2 rounded-full border border-accent-green/10 animate-ping" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-accent-green/40" />
              </div>
            </div>
            <p className="text-xs text-navy-400 font-mono">Awaiting events...</p>
          </div>
        )}
      </div>
    </div>
  );
}
