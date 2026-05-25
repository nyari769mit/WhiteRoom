import { ArrowLeft } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <a href="/" className="inline-flex items-center gap-2 text-xs text-navy-400 hover:text-accent-green mb-8 transition-colors font-mono cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </a>

        <h1 className="text-4xl font-bold mb-2">Documentation</h1>
        <p className="text-navy-400 mb-12">Everything you need to get your AI agents running through WhiteRoom.</p>

        <section className="mb-16">
          <div className="inline-flex items-center gap-2 rounded glass-card px-3 py-1 mb-4">
            <span className="font-mono text-[10px] text-accent-green uppercase tracking-widest">Overview</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">What is WhiteRoom?</h2>
          <div className="text-navy-400 space-y-3 leading-relaxed">
            <p>
              WhiteRoom sits between your AI agents and their AI provider
              (Anthropic, OpenAI, OpenRouter). You change one setting, and WhiteRoom automatically adds:
            </p>
            <ul className="list-none space-y-2 ml-2">
              <li className="flex items-start gap-2">
                <span className="text-accent-green mt-1">{'>'}</span>
                <span><span className="text-navy-100">Shift scheduling</span> — stops conversations from getting too long by giving agents breaks and fresh starts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-green mt-1">{'>'}</span>
                <span><span className="text-navy-100">Automatic summaries</span> — when an agent takes a break, WhiteRoom summarizes what it did so the next session picks up seamlessly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-green mt-1">{'>'}</span>
                <span><span className="text-navy-100">Live dashboard</span> — see which agents are running, what they cost, and what they decided — updated instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-green mt-1">{'>'}</span>
                <span><span className="text-navy-100">Smart model selection</span> — automatically uses a cheaper AI model for simple tasks to save money</span>
              </li>
            </ul>
            <div className="rounded-lg glass-card p-4 mt-4">
              <p className="text-sm">
                <span className="text-accent-green font-mono text-xs">Your keys, your control</span> — WhiteRoom uses your own API keys.
                Your key is passed through in the <code className="text-accent-green font-mono text-xs">Authorization</code> header
                directly to your AI provider. <span className="text-navy-100">We never store your keys.</span>
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="inline-flex items-center gap-2 rounded glass-card px-3 py-1 mb-4">
            <span className="font-mono text-[10px] text-accent-green uppercase tracking-widest">Quickstart</span>
          </div>
          <h2 className="text-2xl font-bold mb-6">Get started in 60 seconds</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-green/10 border border-accent-green/20 text-accent-green text-[10px] font-mono font-bold">1</span>
                Create a trial
              </h3>
              <p className="text-navy-400 mb-3">
                Click &ldquo;Try it instantly&rdquo; on the homepage, or call the API:
              </p>
              <pre className="rounded-lg bg-navy-950 border border-accent-green/10 p-4 text-sm font-mono text-accent-green/80 overflow-x-auto">
                {`curl -X POST https://api.whiteroom.tech/api/trial/create

# Returns: { "trial_token": "abc123", "dashboard_url": "...", "proxy_url": "..." }`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-green/10 border border-accent-green/20 text-accent-green text-[10px] font-mono font-bold">2</span>
                Send a request through WhiteRoom
              </h3>
              <p className="text-navy-400 mb-3">
                Tell your agent to send requests through WhiteRoom instead of directly to the AI provider.
                Use <span className="text-navy-100">your own API key</span> in the Authorization header — it passes straight through to the provider.
              </p>

              <h4 className="text-xs font-mono text-navy-400 uppercase tracking-widest mt-4 mb-2">Python (Anthropic SDK)</h4>
              <pre className="rounded-lg bg-navy-950 border border-accent-green/10 p-4 text-sm font-mono text-accent-green/80 overflow-x-auto">
                {`import anthropic

client = anthropic.Anthropic(
    base_url="https://api.whiteroom.tech/t/{your_token}/v1",
    api_key="sk-ant-...your-real-anthropic-key...",
)

response = client.messages.create(
    model="claude-sonnet-4-5-20250514",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}],
)`}
              </pre>

              <h4 className="text-xs font-mono text-navy-400 uppercase tracking-widest mt-6 mb-2">OpenAI-compatible (GPT, OpenRouter)</h4>
              <pre className="rounded-lg bg-navy-950 border border-accent-green/10 p-4 text-sm font-mono text-accent-green/80 overflow-x-auto">
                {`curl https://api.whiteroom.tech/t/{your_token}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-...your-openai-key..." \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
              </pre>

              <h4 className="text-xs font-mono text-navy-400 uppercase tracking-widest mt-6 mb-2">Quickest option — one environment variable</h4>
              <pre className="rounded-lg bg-navy-950 border border-accent-green/10 p-4 text-sm font-mono text-accent-green/80 overflow-x-auto">
                {`# If you use Anthropic — set this and your agent code stays the same
export ANTHROPIC_BASE_URL=https://api.whiteroom.tech/t/{your_token}/v1

# If you use OpenAI — set this instead
export OPENAI_BASE_URL=https://api.whiteroom.tech/t/{your_token}/v1`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-green/10 border border-accent-green/20 text-accent-green text-[10px] font-mono font-bold">3</span>
                Watch the dashboard
              </h3>
              <p className="text-navy-400">
                The moment your first request hits WhiteRoom, your trial dashboard lights up with real-time data:
                agent status, token counts, costs, governance decisions, and handover documents — all streamed via SSE.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="inline-flex items-center gap-2 rounded glass-card px-3 py-1 mb-4">
            <span className="font-mono text-[10px] text-accent-green uppercase tracking-widest">API Reference</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Routes</h2>

          <div className="space-y-4">
            <div className="rounded-lg glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded">POST</span>
                <code className="text-sm font-mono text-navy-200">/v1/messages</code>
              </div>
              <p className="text-sm text-navy-400">Anthropic-compatible. Forwards to Claude models.</p>
            </div>
            <div className="rounded-lg glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded">POST</span>
                <code className="text-sm font-mono text-navy-200">/v1/chat/completions</code>
              </div>
              <p className="text-sm text-navy-400">OpenAI-compatible. Forwards to GPT/OpenRouter models.</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Headers</h2>
          <p className="text-navy-400 mb-4">All headers are optional — WhiteRoom works without any of these.</p>
          <div className="rounded-lg glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-accent-green/10 text-navy-400">
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest font-medium">Header</th>
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest font-medium">Purpose</th>
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-widest font-medium">Default</th>
                </tr>
              </thead>
              <tbody className="text-navy-200">
                <tr className="border-b border-accent-green/5">
                  <td className="px-5 py-3 font-mono text-xs text-accent-green">Authorization</td>
                  <td className="px-5 py-3 text-navy-400">Your AI provider API key (passed through to the provider, never stored)</td>
                  <td className="px-5 py-3 text-accent-red text-xs font-mono">required</td>
                </tr>
                <tr className="border-b border-accent-green/5">
                  <td className="px-5 py-3 font-mono text-xs text-accent-green">X-Agent-Id</td>
                  <td className="px-5 py-3 text-navy-400">A name for this agent (so you can track it separately in the dashboard)</td>
                  <td className="px-5 py-3 text-navy-600 text-xs font-mono">default</td>
                </tr>
                <tr className="border-b border-accent-green/5">
                  <td className="px-5 py-3 font-mono text-xs text-accent-green">X-Task-Name</td>
                  <td className="px-5 py-3 text-navy-400">Human-readable label shown in the dashboard</td>
                  <td className="px-5 py-3 text-navy-600 text-xs font-mono">none</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-mono text-xs text-accent-green">X-Task-Tier</td>
                  <td className="px-5 py-3 text-navy-400">Tells WhiteRoom to use a cheaper AI model for easy tasks, or a stronger one for hard tasks</td>
                  <td className="px-5 py-3 text-navy-600 text-xs font-mono">standard</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-16">
          <div className="inline-flex items-center gap-2 rounded glass-card px-3 py-1 mb-4">
            <span className="font-mono text-[10px] text-accent-green uppercase tracking-widest">Auth</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Trial vs. Production</h2>
          <div className="space-y-4">
            <div className="rounded-lg glass-card p-5">
              <h3 className="text-sm font-semibold text-navy-100 mb-2 font-mono">Trial (24 hours, no signup)</h3>
              <p className="text-sm text-navy-400 mb-2">Your trial token is part of the URL — no extra setup needed:</p>
              <code className="text-xs font-mono text-accent-green/80">POST /t/&#123;trial_token&#125;/v1/messages</code>
            </div>
            <div className="rounded-lg glass-card p-5">
              <h3 className="text-sm font-semibold text-navy-100 mb-2 font-mono">Production (permanent workspace)</h3>
              <p className="text-sm text-navy-400 mb-2">
                After signing up and saving your workspace, go to the API Keys page in your dashboard
                to create a permanent key. Then add it as a header to your requests:
              </p>
              <pre className="rounded-lg bg-navy-950 border border-accent-green/10 p-3 text-xs font-mono text-accent-green/80 overflow-x-auto mt-2">
                {`curl https://api.whiteroom.tech/v1/messages \\
  -H "Authorization: Bearer sk-ant-...your-llm-key..." \\
  -H "X-WhiteRoom-Key: wr_...your-whiteroom-api-key..." \\
  -d '{ ... }'`}
              </pre>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="inline-flex items-center gap-2 rounded glass-card px-3 py-1 mb-4">
            <span className="font-mono text-[10px] text-accent-green uppercase tracking-widest">Concepts</span>
          </div>
          <h2 className="text-2xl font-bold mb-6">Core Concepts</h2>
          <div className="space-y-6 text-navy-400">
            <div>
              <h3 className="text-lg font-semibold text-navy-50 mb-2">Shifts and Breaks</h3>
              <p>
                Each agent works in a &ldquo;shift&rdquo; — a period of active work with a message limit
                (default: 100K tokens, roughly 75,000 words). When the limit is reached, WhiteRoom
                summarizes what the agent did, gives it a short break (default: 60 seconds), then
                restarts it with the summary. This keeps conversations short and costs low.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy-50 mb-2">Automatic Summaries</h3>
              <p>
                When a shift ends, WhiteRoom asks the AI to summarize everything the agent did —
                what decisions it made, where it left off, what still needs to be done, and any
                warnings. This summary is automatically given to the agent when it starts its next
                shift, so it picks up right where it left off — without re-reading the entire conversation.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy-50 mb-2">Agent Pairing</h3>
              <p>
                Two agents can be paired so they take turns. When Agent A takes a break, Agent B
                picks up. WhiteRoom makes sure they never run at the same time — so one is always
                working while the other rests.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy-50 mb-2">Smart Model Selection</h3>
              <p>
                Add the <code className="text-accent-green font-mono text-xs">X-Task-Tier</code> header
                set to <code className="text-accent-green font-mono text-xs">simple</code> and WhiteRoom
                automatically uses a cheaper AI model (e.g. Haiku instead of Opus) to save money.
                Set it to <code className="text-accent-green font-mono text-xs">complex</code> and
                it uses the most powerful model available.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy-50 mb-2">When an Agent is on Break</h3>
              <p>
                If your agent tries to send a message while it&apos;s on break, WhiteRoom returns an error
                with a <code className="text-accent-green font-mono text-xs">whiteroom</code> field
                telling your code why and how long to wait before trying again:
              </p>
              <pre className="rounded-lg bg-navy-950 border border-accent-green/10 p-3 text-xs font-mono text-accent-green/80 overflow-x-auto mt-3">
                {`{
  "type": "error",
  "error": { "type": "rate_limit_error" },
  "whiteroom": {
    "reason": "watch_limit_exceeded",
    "retryAfter": 60
  }
}`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
