'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { SSEEvent } from '@/hooks/use-sse';

interface HandoverHighlightProps {
  events: SSEEvent[];
}

export function HandoverHighlight({ events }: HandoverHighlightProps) {
  const [expanded, setExpanded] = useState(false);
  const handovers = events.filter((e) => e.eventType === 'handover.generated');

  if (handovers.length === 0) return null;

  const latest = handovers[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl glass-card border-l-2 border-l-accent-green p-5 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-accent-green/[0.04] to-transparent" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-green/5 border border-accent-green/15">
            <FileText className="h-4 w-4 text-accent-green" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-navy-200">Handover Generated</h4>
              <Sparkles className="h-3 w-3 text-accent-green" />
            </div>
            <p className="text-[10px] text-navy-600 font-mono mt-0.5">
              Agent {latest.agentId} completed watch cycle
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] font-mono text-navy-400 hover:text-accent-green transition-colors cursor-pointer px-2 py-1 rounded hover:bg-accent-green/5"
          aria-label={expanded ? 'Collapse handover details' : 'Expand handover details'}
        >
          {expanded ? 'HIDE' : 'VIEW'}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && latest.payload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 relative"
          >
            <pre className="text-xs text-accent-green/60 font-mono bg-navy-950 rounded-lg p-4 overflow-x-auto border border-accent-green/10">
              {JSON.stringify(latest.payload, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
