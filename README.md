# WHITE ROOM 🚢

> **Maritime-inspired governance middleware for AI agent fleets.**  
> Enforce structured work/rest cycles for any LLM agent — framework agnostic, cloud deployed, zero configuration.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![Deployed on Render](https://img.shields.io/badge/Deployed-Render-purple.svg)](https://render.com)

---

## The Problem

AI agents that run continuously accumulate growing context windows. Every call becomes more expensive than the last. Output quality degrades. There is no recovery mechanism — the agent just keeps working until it fails or costs spiral.

This is the same problem solved in maritime law 50 years ago. A ship's officer cannot work indefinitely. The STCW convention enforces a 6-hour on / 6-hour off watch system. Fatigue kills ships. Unbounded context kills agents.

**WhiteRoom applies the same principle to AI agents.**

---

## How It Works

WhiteRoom sits between your agent and any LLM API as a transparent proxy:

```
Your Agent → WhiteRoom → LLM API (Anthropic, OpenAI, or any compatible endpoint)
```

### The Universal Cycle

Every agent — whether solo or part of a fleet — follows the same governance cycle:

```
Agent works → Watch limit hit → WhiteRoom pauses the agent
     │
     ▼
Agent compresses its context into a structured handover document
(decisions made, pending tasks, warnings — the essentials only)
     │
     ▼
Context window cleared → Agent rests for defined period
     │
     ▼
Agent restarts with only the compressed handover as its starting context
(fraction of the original token cost)
     │
     ▼
Cycle repeats
```

**For a single agent:** WhiteRoom pauses it, compresses its context, clears the window, and restarts it fresh with only the handover summary. No relief agent needed.

**For a paired fleet:** WhiteRoom pauses the primary agent and hands the compressed context to the relief agent, who continues the work while the primary rests. When the primary wakes, it picks up from the next handover document.

In both cases the saving is the same — the agent never pays to carry its full history forward. Only what matters gets passed on.

---

## Quick Start

### Connect any existing agent in 60 seconds

**Step 1 — Point your agent at WhiteRoom**

Set one environment variable before running your agent:

```bash
# For Anthropic
export ANTHROPIC_BASE_URL=https://whiteroom-m4j4.onrender.com

# For OpenAI / OpenAI-compatible
export OPENAI_BASE_URL=https://whiteroom-m4j4.onrender.com
```

Your existing API key and code stay exactly the same. WhiteRoom intercepts every `/v1/messages` call automatically.

**Step 2 — Open your personalized dashboard**

Visit:
```
https://whiteroom-m4j4.onrender.com
```

Enter your API key on the login screen. WhiteRoom identifies your fleet from your key and shows only your agents. Your key is never stored — it is hashed immediately and used only as a fleet identifier.

**Step 3 — Watch your agents governed in real time**

Click **RUN LIVE**. Your agents appear within 10 seconds of their first call. No configuration needed.

---

## Self-Hosting

### Prerequisites
- Node.js 18+
- npm

### Install and run

```bash
git clone https://github.com/nyari769mit/WhiteRoom.git
cd WhiteRoom
npm install
node server.js
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `WATCH_MINUTES` | `360` | Watch limit in minutes (6 hours) |
| `REST_MINUTES` | `360` | Rest period in minutes (6 hours) |

---

## API Reference

All governance calls go to `POST /api/white-room` with a JSON body.

### Register an agent
```json
{
  "action": "register_agent",
  "fleet_id": "my-fleet",
  "agent_id": "agent-1",
  "agent_role": "Researcher"
}
```

### Start a watch
```json
{
  "action": "start_watch",
  "fleet_id": "my-fleet",
  "agent_id": "agent-1"
}
```

### Check watch status
```json
{
  "action": "check_watch",
  "fleet_id": "my-fleet",
  "agent_id": "agent-1"
}
```

### Pair agents (primary + relief)
```json
{
  "action": "pair_agents",
  "fleet_id": "my-fleet",
  "agent_id": "agent-1",
  "paired_with": "agent-2"
}
```

### Initiate handover
```json
{
  "action": "initiate_handover",
  "fleet_id": "my-fleet",
  "agent_id": "agent-1",
  "to_agent": "agent-2",
  "context_summary": "Completed research phase. Agent-2 to continue writing."
}
```

### Fleet report
```json
{
  "action": "fleet_report",
  "fleet_id": "my-fleet"
}
```

### List all fleets
```json
{
  "action": "list_fleets"
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    YOUR AGENTS                       │
│  Agent A (Primary)      Agent B (Relief)            │
│  LLM_BASE_URL  =  WhiteRoom URL                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                   WHITE ROOM                         │
│                                                      │
│  /v1/messages proxy   ←── intercepts all API calls  │
│  Watch engine         ←── tracks time & tokens      │
│  Rest enforcer        ←── blocks on 429             │
│  Auto-alarm           ←── wakes after rest          │
│  Fleet dashboard      ←── live governance view      │
│  Audit log            ←── full event history        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                   YOUR LLM API                       │
│     (Anthropic, OpenAI, or any compatible API)      │
└─────────────────────────────────────────────────────┘
```

### Key components

**`engine.js`** — Core governance logic. Manages fleet state, watch cycles, rest periods, handovers, and audit logs. All state is in-memory.

**`server.js`** — Express server. Exposes `/api/white-room` for governance actions and `/v1/messages` as the Anthropic proxy. Auto-registers agents on first call.

**`dashboard.html`** — Live governance dashboard. Auto-discovers all active fleets and agents. Polls WhiteRoom every 10 seconds. Shows watch progress, health decay, token accumulation, and savings comparison.

---

## Watch/Rest Cycle

### Single Agent
```
Agent works → Watch limit hit → WhiteRoom blocks (429)
     │
     ▼
Agent compresses context → Handover document generated
     │
     ▼
Context cleared → Rest period begins
     │
     ▼
Auto-alarm fires → Agent restarts with compressed context only
     │
     ▼
Cycle repeats — token cost stays flat across every cycle
```

### Paired Fleet (Primary + Relief)
```
Primary works → Watch limit hit → WhiteRoom blocks (429)
     │
     ▼
Compressed handover passed to Relief agent → Relief continues work
     │
     ▼
Primary rests → Context cleared → Health recovers
     │
     ▼
Primary wakes → Ready for next watch
     │
     ▼
Cycle repeats — continuous operation, no downtime
```

---

## Framework Compatibility

WhiteRoom works with any framework that uses the Anthropic SDK:

| Framework | Compatible | How |
|-----------|-----------|-----|
| Raw Anthropic SDK | ✅ | Set `ANTHROPIC_BASE_URL` |
| CrewAI | ✅ | Set `ANTHROPIC_BASE_URL` |
| LangChain | ✅ | Set `ANTHROPIC_BASE_URL` |
| LlamaIndex | ✅ | Set `ANTHROPIC_BASE_URL` |
| Custom agents | ✅ | Set `ANTHROPIC_BASE_URL` |
| OpenClaw | ✅ | Set base URL in config |

---

## Savings Calculation

WhiteRoom calculates governance savings per handover:

```
tokens_saved = context_before_handover - fresh_context_after_handover
cost_saved   = tokens_saved × $0.0000008  (Haiku input pricing)
energy_saved = tokens_saved × 0.0000004 kWh
```

In testing: a 10-minute watch cycle with 10 tasks accumulated 4,420 tokens. Handover compressed context to ~2,000 tokens — a **55% reduction** per handover cycle.

---

## Known Limitations

- **Stateless** — Fleet state is in-memory. WhiteRoom restarts clear all registrations. Agents auto-re-register on their next call. Persistent storage (Redis/SQLite) is on the roadmap.
- **Single instance** — One WhiteRoom instance handles all fleets. No horizontal scaling yet.
- **Handover context** — Currently a plain text summary. Structured handover documents (decisions, pending tasks, warnings) are in development.
- **Single-agent mode** — Self-handover (no relief agent needed) is in development.
- **Skill-based routing** — Agent skill declarations and task-based routing are on the roadmap.

---

## Roadmap

- [ ] **Structured handover documents** — replace plain text summary with a schema covering world state, decisions made, pending tasks, and warnings. Outgoing agent generates the document via a final compression call before handing over.
- [ ] **Single-agent self-handover** — when no relief agent exists, the agent pauses, compresses its full context into a handover document, clears its context window, then restarts fresh using only the compressed summary. Same token savings, no paired agent needed.
- [ ] **Real token divergence tracking** — measure actual context size before and after each handover to show true savings vs the no-rest baseline.
- [ ] **Persistent state** — Redis or SQLite so fleet registrations survive restarts.
- [ ] **Skill-based agent queuing** — agents declare skills, tasks declare requirements, WhiteRoom routes the right agent to the right task.
- [ ] **Hierarchical fleet governance** — orchestrator + sub-agent trees, with context compression at every handover level.
- [ ] **npm package** — `npm install whiteroom` for self-hosted governance.
- [ ] **Python SDK** — `pip install whiteroom` for Python-based agent frameworks.
- [ ] **Multi-LLM support** — govern agents calling OpenAI, Gemini, or any OpenAI-compatible endpoint.

---

## Inspiration

WhiteRoom is inspired by the Maritime Labour Convention (MLC 2006) and the Standards of Training, Certification and Watchkeeping (STCW) — the international framework governing rest and duty hours for seafarers. The same principles that prevent maritime disasters apply to AI agents operating at scale.

---

## Built By

**Nyari Nain** — MIT Sloan Fellows MBA 2026 · Co-founder, Artory.AI  
Research conducted as part of MIT Sloan 15.S12 — Agentic Web (Spring 2026)

---

## License

MIT License — see [LICENSE](LICENSE) for details.
