'use client';

import { motion } from 'framer-motion';
import { StatusDot } from '@/components/status-dot';
import { formatTokens } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { SSEEvent } from '@/hooks/use-sse';

interface AgentInfo {
  agentId: string;
  status: 'working' | 'resting' | 'idle';
  currentTask?: string;
  tokensIn: number;
  tokensOut: number;
  callCount: number;
  watchPercent: number;
}

interface AgentCardProps {
  agent: AgentInfo;
  latestEvent?: SSEEvent;
}

function progressColor(percent: number): string {
  if (percent >= 90) return 'bg-accent-red shadow-[0_0_8px_rgba(255,59,92,0.4)]';
  if (percent >= 70) return 'bg-accent-amber shadow-[0_0_8px_rgba(255,184,0,0.3)]';
  return 'bg-accent-green shadow-[0_0_8px_rgba(0,255,136,0.3)]';
}

export function AgentCard({ agent, latestEvent }: AgentCardProps) {
  const isResting = agent.status === 'resting';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isResting ? 0.5 : 1, scale: 1 }}
      className={cn(
        'rounded-xl glass-card p-5 transition-all duration-200 relative overflow-hidden',
        agent.status === 'working' && 'hud-border',
        agent.status === 'resting' && 'border-accent-amber/15',
        agent.status === 'idle' && 'hover:border-accent-green/15',
      )}
    >
      {agent.status === 'working' && (
        <div className="absolute inset-0 bg-gradient-to-br from-accent-green/[0.03] to-transparent" />
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <StatusDot status={agent.status} />
            <span className="font-semibold text-sm font-mono truncate max-w-[140px]">{agent.agentId}</span>
          </div>
          <span className={cn(
            'text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded',
            agent.status === 'working' && 'bg-accent-green/10 text-accent-green',
            agent.status === 'resting' && 'bg-accent-amber/10 text-accent-amber',
            agent.status === 'idle' && 'bg-navy-800 text-navy-400',
          )}>
            {agent.status}
          </span>
        </div>

        {agent.currentTask && (
          <div className="mb-3 text-xs text-navy-400 truncate flex items-center gap-1.5 font-mono">
            <div className="h-1 w-1 rounded-full bg-accent-green animate-pulse shrink-0" />
            {agent.currentTask}
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-navy-400 mb-1.5 font-mono uppercase tracking-wider">
            <span>Watch</span>
            <span className={cn(
              agent.watchPercent >= 90 && 'text-accent-red',
              agent.watchPercent >= 70 && agent.watchPercent < 90 && 'text-accent-amber',
            )}>
              {Math.round(agent.watchPercent)}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-navy-800/80 overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', progressColor(agent.watchPercent))}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, agent.watchPercent)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center border-t border-accent-green/5 pt-3">
          <div>
            <div className="text-[9px] text-navy-600 uppercase tracking-widest font-mono mb-0.5">In</div>
            <div className="text-sm font-medium font-mono">{formatTokens(agent.tokensIn)}</div>
          </div>
          <div className="border-x border-accent-green/5">
            <div className="text-[9px] text-navy-600 uppercase tracking-widest font-mono mb-0.5">Out</div>
            <div className="text-sm font-medium font-mono">{formatTokens(agent.tokensOut)}</div>
          </div>
          <div>
            <div className="text-[9px] text-navy-600 uppercase tracking-widest font-mono mb-0.5">Calls</div>
            <div className="text-sm font-medium font-mono">{agent.callCount}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
