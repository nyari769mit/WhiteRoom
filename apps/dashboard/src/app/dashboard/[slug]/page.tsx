'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSSE } from '@/hooks/use-sse';
import { fetchWorkspaceDetails } from '@/lib/api';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { AgentCard } from '@/components/dashboard/agent-card';
import { HandoverHighlight } from '@/components/dashboard/handover-highlight';
import { AuditLog } from '@/components/dashboard/audit-log';
import { ConnectionStatus } from '@/components/dashboard/connection-status';
import { CopyButton } from '@/components/copy-button';
import { deriveAgents } from '@/lib/derive-agents';
import { Sparkles, Key, Terminal } from 'lucide-react';

export default function OverviewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { events, status } = useSSE(slug);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetchWorkspaceDetails(slug).then((data) => {
      if (data) setIsNew(true);
    });
  }, [slug]);

  const agents = useMemo(() => deriveAgents(events), [events]);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Overview</h1>
        <ConnectionStatus status={status} />
      </div>

      {isNew && events.length === 0 && (
        <div className="rounded-xl glass-card p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-green/5 border border-accent-green/15">
              <Sparkles className="h-5 w-5 text-accent-green" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Welcome to your workspace</h3>
              <p className="text-sm text-navy-400 leading-relaxed">
                Two quick steps to start sending your agent&apos;s requests through WhiteRoom:
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            <div className="rounded-lg bg-navy-950/50 border border-accent-green/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-accent-green" />
                <span className="text-xs font-mono text-accent-green uppercase tracking-widest">Step 1</span>
              </div>
              <p className="text-sm text-navy-400 mb-3">Create an API key for your workspace</p>
              <a
                href={`/dashboard/${slug}/api-keys`}
                className="inline-flex items-center gap-1 text-xs font-mono text-accent-green hover:underline cursor-pointer"
              >
                Go to API Keys &rarr;
              </a>
            </div>

            <div className="rounded-lg bg-navy-950/50 border border-accent-green/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4 text-accent-green" />
                <span className="text-xs font-mono text-accent-green uppercase tracking-widest">Step 2</span>
              </div>
              <p className="text-sm text-navy-400 mb-3">Add this header to your agent&apos;s requests</p>
              <div className="rounded bg-navy-950 border border-accent-green/10 p-2 font-mono text-[10px] text-accent-green/70 flex items-center justify-between gap-2">
                <span className="truncate">-H &quot;X-WhiteRoom-Key: wr_...&quot;</span>
                <CopyButton text='-H "X-WhiteRoom-Key: wr_..."' className="!px-1.5 !py-0.5 !text-[9px]" />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-navy-600 font-mono">
            You still use your own AI provider API key — we pass it straight through and never store it.{' '}
            <a href="/docs" className="text-accent-green hover:underline">Full docs &rarr;</a>
          </p>
        </div>
      )}

      <StatsCards events={events} />

      {agents.length > 0 && (
        <div>
          <h3 className="text-xs font-mono font-semibold text-navy-400 uppercase tracking-widest mb-3">Agents</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.agentId} agent={agent} />
            ))}
          </div>
        </div>
      )}

      <HandoverHighlight events={events} />
      <AuditLog events={events} />
    </div>
  );
}
