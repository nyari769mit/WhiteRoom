'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSSE } from '@/hooks/use-sse';
import { SignInButton, useUser } from '@clerk/nextjs';
import { CopyButton } from '@/components/copy-button';
import { deriveAgents } from '@/lib/derive-agents';
import { ConnectionStatus } from '@/components/dashboard/connection-status';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { AgentCard } from '@/components/dashboard/agent-card';
import { AuditLog } from '@/components/dashboard/audit-log';
import { HandoverHighlight } from '@/components/dashboard/handover-highlight';
import { promoteTrial } from '@/lib/api';
import { Clock, ArrowRight, Loader2, Sparkles, Info } from 'lucide-react';

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:8080';

export default function TrialDashboard() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const slug = `trial-${token}`;
  const { user, isSignedIn } = useUser();
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);

  const { events, status } = useSSE(slug);
  const hasData = events.length > 0;

  async function handlePromote() {
    if (!user) return;
    setPromoting(true);
    try {
      const result = await promoteTrial(token, user.id);
      setPromoted(true);
      setTimeout(() => {
        router.replace(`/dashboard/${result.slug}`);
      }, 2000);
    } catch {
      setPromoting(false);
    }
  }

  const agents = useMemo(() => deriveAgents(events), [events]);

  const baseUrl = `${PROXY_URL}/t/${token}/v1`;

  return (
    <div className="min-h-screen bg-navy-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              White<span className="text-accent-green neon-text-subtle">Room</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-3.5 w-3.5 text-accent-amber" />
              <span className="text-[10px] text-accent-amber font-mono uppercase tracking-wider">Trial — 24 hour access</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus status={status} />
            {isSignedIn ? (
              promoted ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 rounded-lg bg-accent-green/10 border border-accent-green/20 px-4 py-2"
                >
                  <Sparkles className="h-4 w-4 text-accent-green" />
                  <span className="text-xs text-accent-green font-mono">Workspace saved! Redirecting...</span>
                </motion.div>
              ) : (
                <button
                  onClick={handlePromote}
                  disabled={promoting}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent-green/10 border border-accent-green/30 px-4 py-2 text-sm font-semibold text-accent-green hover:bg-accent-green/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {promoting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Keep this workspace
                </button>
              )
            ) : (
              <SignInButton mode="modal">
                <button className="inline-flex items-center gap-2 rounded-lg bg-accent-green/10 border border-accent-green/30 px-4 py-2 text-sm font-semibold text-accent-green hover:bg-accent-green/20 transition-all cursor-pointer">
                  Sign up to keep data
                </button>
              </SignInButton>
            )}
          </div>
        </div>

        {!hasData ? (
          <WaitingState baseUrl={baseUrl} token={token} />
        ) : (
          <LiveDashboard events={events} agents={agents} />
        )}
      </div>
    </div>
  );
}

function WaitingState({ baseUrl, token }: { baseUrl: string; token: string }) {
  const [tab, setTab] = useState<'python' | 'curl' | 'typescript'>('python');

  const snippets = {
    python: `import anthropic

# Send requests through WhiteRoom — your API key passes through, never stored
client = anthropic.Anthropic(
    base_url="${baseUrl}",
    api_key="sk-ant-...your-own-key...",  # Replace with your real Anthropic API key
)

response = client.messages.create(
    model="claude-sonnet-4-5-20250514",
    max_tokens=1024,
    extra_headers={
        "X-Agent-Id": "my-agent",       # Identify this agent
        "X-Task-Name": "code-review",    # What it's doing (shown in dashboard)
    },
    messages=[{"role": "user", "content": "Hello from WhiteRoom!"}],
)
print(response.content[0].text)`,

    curl: `curl ${baseUrl}/messages \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-ant-...your-own-key..." \\
  -H "X-Agent-Id: my-agent" \\
  -H "X-Task-Name: code-review" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "claude-sonnet-4-5-20250514",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello from WhiteRoom!"}]
  }'`,

    typescript: `import Anthropic from "@anthropic-ai/sdk";

// Send requests through WhiteRoom — your API key passes through, never stored
const client = new Anthropic({
  baseURL: "${baseUrl}",
  apiKey: "sk-ant-...your-own-key...",  // Replace with your real Anthropic API key
});

const response = await client.messages.create({
  model: "claude-sonnet-4-5-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello from WhiteRoom!" }],
}, {
  headers: {
    "X-Agent-Id": "my-agent",       // Identify this agent
    "X-Task-Name": "code-review",   // What it's doing (shown in dashboard)
  },
});
console.log(response.content[0].text);`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto mt-12"
    >
      <div className="text-center mb-10">
        <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-xl bg-accent-green/5 border border-accent-green/15 mb-6">
          <div className="h-3 w-3 rounded-full bg-accent-green animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
          <div className="absolute inset-0 rounded-xl border border-accent-green/10 animate-ping opacity-30" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Waiting for your first message</h2>
        <p className="text-navy-400">Run the code below and your dashboard will light up instantly</p>
      </div>

      <div className="rounded-xl glass-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-4 w-4 text-accent-blue" />
          <span className="text-xs font-mono text-accent-blue uppercase tracking-wider">How it works</span>
        </div>
        <p className="text-sm text-navy-300 mb-3 leading-relaxed">
          WhiteRoom sits between your AI agent and its AI provider (like Anthropic or OpenAI).
          You use <span className="text-navy-100 font-medium">your own API key</span> (we never store it). Just change one setting
          and your agent works exactly as before — WhiteRoom handles the rest automatically.
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-navy-400 font-mono">
          <span>Anthropic</span>
          <span className="text-navy-700">|</span>
          <span>OpenAI</span>
          <span className="text-navy-700">|</span>
          <span>OpenRouter</span>
        </div>
      </div>

      <div className="rounded-xl glass-card overflow-hidden mb-6">
        <div className="flex items-center justify-between border-b border-accent-green/10 px-4">
          <div className="flex">
            {(['python', 'curl', 'typescript'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                  tab === t
                    ? 'text-accent-green border-b-2 border-accent-green'
                    : 'text-navy-400 hover:text-navy-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <CopyButton text={snippets[tab]} />
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-navy-200 leading-relaxed whitespace-pre">{snippets[tab]}</pre>
        </div>
      </div>

      <div className="rounded-xl glass-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono text-navy-400 uppercase tracking-widest">Optional headers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-navy-400">
                <th className="pb-2 pr-4 font-mono text-[10px] uppercase tracking-widest font-medium">Header</th>
                <th className="pb-2 pr-4 font-mono text-[10px] uppercase tracking-widest font-medium">Purpose</th>
                <th className="pb-2 font-mono text-[10px] uppercase tracking-widest font-medium">Example</th>
              </tr>
            </thead>
            <tbody className="text-navy-200">
              <tr className="border-t border-accent-green/5">
                <td className="py-2.5 pr-4 font-mono text-xs text-accent-green">X-Agent-Id</td>
                <td className="py-2.5 pr-4 text-xs text-navy-400">Give this agent a name so you can track it separately</td>
                <td className="py-2.5 font-mono text-xs text-navy-400">my-agent-1</td>
              </tr>
              <tr className="border-t border-accent-green/5">
                <td className="py-2.5 pr-4 font-mono text-xs text-accent-green">X-Task-Name</td>
                <td className="py-2.5 pr-4 text-xs text-navy-400">Label what the agent is doing right now</td>
                <td className="py-2.5 font-mono text-xs text-navy-400">code-review</td>
              </tr>
              <tr className="border-t border-accent-green/5">
                <td className="py-2.5 pr-4 font-mono text-xs text-accent-green">X-Task-Tier</td>
                <td className="py-2.5 pr-4 text-xs text-navy-400">Use a cheaper AI model for easy tasks</td>
                <td className="py-2.5 font-mono text-xs text-navy-400">simple | standard | complex</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <StepItem n={1} text="Copy the code snippet above" done />
        <StepItem n={2} text="Replace the API key with your real key" />
        <StepItem n={3} text="Run it — your dashboard updates in real-time" />
      </div>

      <p className="text-center text-[10px] text-navy-600 font-mono">
        Need help?{' '}
        <a href="/docs" className="text-accent-green hover:underline">
          Read the full docs
        </a>
      </p>
    </motion.div>
  );
}

function StepItem({ n, text, done }: { n: number; text: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-mono font-bold ${
          done
            ? 'bg-accent-green/10 border border-accent-green/30 text-accent-green'
            : 'bg-navy-800/50 border border-accent-green/10 text-navy-400'
        }`}
      >
        {n}
      </div>
      <span className={`text-sm ${done ? 'text-navy-200' : 'text-navy-400'}`}>{text}</span>
    </div>
  );
}

function LiveDashboard({
  events,
  agents,
}: {
  events: ReturnType<typeof useSSE>['events'];
  agents: Array<{
    agentId: string;
    status: 'working' | 'resting' | 'idle';
    currentTask?: string;
    tokensIn: number;
    tokensOut: number;
    callCount: number;
    watchPercent: number;
  }>;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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
    </motion.div>
  );
}
