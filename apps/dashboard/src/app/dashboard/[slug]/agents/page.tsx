'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchFleetReport } from '@/lib/api';
import { fetchWorkspaceDetails } from '@/lib/api';
import { StatusDot } from '@/components/status-dot';
import { formatTokens } from '@/lib/utils';
import { Bot } from 'lucide-react';

export default function AgentsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [agents, setAgents] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaceDetails(slug).then(async (data) => {
      if (!data?.fleets?.[0]) { setLoading(false); return; }
      const report = await fetchFleetReport(slug, data.fleets[0].id);
      if (report?.agents) setAgents(report.agents);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return <div className="text-navy-400">Loading agents...</div>;
  }

  if (agents.length === 0) {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold mb-8">Agents</h1>
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 p-12 text-center">
          <Bot className="h-8 w-8 text-navy-600 mx-auto mb-4" />
          <h3 className="text-sm font-semibold mb-2">No agents yet</h3>
          <p className="text-sm text-navy-400">Agents are auto-registered when they make their first request through WhiteRoom.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold mb-8">Agents</h1>
      <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-800 text-navy-400">
              <th className="text-left px-5 py-3 font-medium">Agent</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Task</th>
              <th className="text-right px-5 py-3 font-medium">Health</th>
              <th className="text-right px-5 py-3 font-medium">Tokens</th>
              <th className="text-right px-5 py-3 font-medium">Calls</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent: Record<string, unknown>) => (
              <tr key={agent.id as string} className="border-b border-navy-800/50 last:border-0">
                <td className="px-5 py-3 font-medium">{(agent.name as string) || (agent.agentKey as string)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <StatusDot status={agent.status as 'working' | 'resting' | 'idle'} />
                    <span className="capitalize text-navy-400">{agent.status as string}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-navy-400 truncate max-w-[200px]">
                  {(agent.currentTask as string) || '—'}
                </td>
                <td className="px-5 py-3 text-right">{agent.health as number}%</td>
                <td className="px-5 py-3 text-right text-navy-400">
                  {formatTokens(((agent.inputTokens as number) || 0) + ((agent.outputTokens as number) || 0))}
                </td>
                <td className="px-5 py-3 text-right text-navy-400">{agent.callCount as number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
