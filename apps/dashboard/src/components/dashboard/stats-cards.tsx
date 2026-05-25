'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/animated-counter';
import { Activity, Zap, DollarSign, Clock } from 'lucide-react';
import type { SSEEvent } from '@/hooks/use-sse';

interface StatsCardsProps {
  events: SSEEvent[];
}

export function StatsCards({ events }: StatsCardsProps) {
  const stats = useMemo(() => {
    const responses = events.filter((e) => e.eventType === 'agent.response');
    const totalTokens = responses.reduce((s, e) => s + (e.tokensIn ?? 0) + (e.tokensOut ?? 0), 0);
    const totalCost = responses.reduce((s, e) => s + (e.costCents ?? 0), 0);
    const handovers = events.filter((e) => e.eventType === 'handover.generated').length;

    return [
      { icon: Activity, label: 'Total Requests', value: responses.length, color: 'text-accent-blue', glow: 'rgba(0,191,255,0.06)' },
      { icon: Zap, label: 'Tokens Used', value: totalTokens, color: 'text-accent-amber', glow: 'rgba(255,184,0,0.06)' },
      { icon: DollarSign, label: 'Total Cost', value: Math.round(totalCost), prefix: '$', color: 'text-accent-green', glow: 'rgba(0,255,136,0.06)' },
      { icon: Clock, label: 'Handovers', value: handovers, color: 'text-accent-green', glow: 'rgba(0,255,136,0.06)' },
    ];
  }, [events]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative rounded-xl glass-card p-5 overflow-hidden hud-border"
          style={{ boxShadow: `inset 0 0 30px ${stat.glow}` }}
        >
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-[10px] text-navy-400 font-mono uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold font-mono">
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                duration={1}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
