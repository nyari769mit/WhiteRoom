# @whiteroom/engine

[![npm version](https://img.shields.io/npm/v/@whiteroom/engine)](https://www.npmjs.com/package/@whiteroom/engine)
[![CI](https://github.com/guideage/whiteroom/actions/workflows/ci.yml/badge.svg)](https://github.com/guideage/whiteroom/actions)
[![License: BSL 1.1](https://img.shields.io/badge/license-BSL%201.1-blue)](https://github.com/guideage/whiteroom/blob/main/LICENSE)

Pure governance engine for AI agent fleets. Zero I/O, zero side effects, zero dependencies (besides `@whiteroom/shared`) -- just functions.

## Why

AI agents accumulate context with every LLM call. Without governance, each call is more expensive than the last -- cost grows quadratically. WhiteRoom enforces watch/rest cycles that reset context periodically, cutting token costs by up to 88%.

This package is the core decision engine. It takes agent state in, returns governance decisions out. No database calls, no HTTP, no side effects -- making it 100% testable and easy to integrate anywhere.

## Install

```bash
npm install @whiteroom/engine @whiteroom/shared
```

## Quick Start

```typescript
import { evaluateRequest } from '@whiteroom/engine';
import type { AgentState, FleetConfig } from '@whiteroom/shared';

// Define your agent's current state
const agent: AgentState = {
  agentId: 'claims-bot-1',
  fleetId: 'my-fleet',
  skills: ['legal-review'],
  status: 'working',
  currentWatchTokens: 95000,   // near the 100K limit
  watchStartedAt: new Date(),
  restUntil: null,
  pairedWith: null,
  inputTokens: 95000,
  outputTokens: 14000,
  callCount: 42,
};

// Define fleet governance rules
const fleet: FleetConfig = {
  fleetId: 'my-fleet',
  watchLimitTokens: 100000,    // 100K token budget per watch
  restSeconds: 60,             // 60s mandatory rest after watch
};

// Ask the engine: should this request proceed?
const decision = evaluateRequest({
  agent,
  fleet,
  estimatedTokens: 8000,       // this request would push past the limit
  requestedModel: 'claude-sonnet-4-5',
});

console.log(decision);
// {
//   action: 'compress',
//   reason: 'Watch token limit reached',
//   shouldGenerateHandover: true
// }
```

## API

### `evaluateRequest(params)` -> `GovernanceDecision`

Core governance decision. Returns one of four actions:

| Action | Meaning | What to do |
|--------|---------|------------|
| `allow` | Request is within limits | Forward to LLM provider |
| `compress` | Watch limit reached | Generate handover doc, then rest the agent |
| `block` | Agent is resting | Return 429 with `retryAfterSeconds` |
| `reroute` | Task tier mismatch | Use `suggestedModel` instead |

### `shouldFireAlarm(params)` -> `boolean`

Check if a resting agent should wake up. Prevents the paired-agent bug where both agents end up working simultaneously.

### `estimateSavings(params)` -> `SavingsResult`

Calculate token and cost savings using the compounding formula:
- **Without WhiteRoom:** `avgTokensPerCall * N * (N+1) / 2` (quadratic growth)
- **With WhiteRoom:** `avgTokensPerCall * N` (linear)

```typescript
import { estimateSavings } from '@whiteroom/engine';

const savings = estimateSavings({
  inputTokens: 90000,
  outputTokens: 10000,
  callCount: 50,
  handoverCount: 5,
  model: 'claude-sonnet-4-5',
});

console.log(savings);
// { tokensWithout: 2550000, tokensWith: 100000, savedCents: 1234, ... }
```

### `pickAgentForTask(params)` -> `{ agentId, reason } | null`

Select the best available agent by skill match and current utilization.

### `watchProgress(agent, fleet)` -> `number`

Current watch completion as a percentage (0-100).

### `agentHealth(agent, fleet)` -> `number`

Health score (20-100) for dashboard visualization.

### `selectModelForTier(model, tier)` -> `RoutingResult`

Route simple tasks to cheaper models, complex tasks to premium models.

## Key Concepts

- **Watch cycle** -- a token budget (default 100K) an agent works within before mandatory rest
- **Handover document** -- compressed summary of agent state (decisions, pending tasks, warnings) passed to the next agent or same agent after rest
- **Agent pairing** -- primary/relief rotation so work continues during rest periods
- **Self-handover** -- solo agents compress and resume from their own handover doc

## License

[BSL 1.1](https://github.com/guideage/whiteroom/blob/main/LICENSE) -- converts to Apache 2.0 after 4 years.

Built by [Guideage](https://guideage.ai).
