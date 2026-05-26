# @whiteroom/shared

[![npm version](https://img.shields.io/npm/v/@whiteroom/shared)](https://www.npmjs.com/package/@whiteroom/shared)
[![License: BSL 1.1](https://img.shields.io/badge/license-BSL%201.1-blue)](https://github.com/guideage/whiteroom/blob/main/LICENSE)

Shared types, constants, and utilities for the WhiteRoom governance engine. This is the foundation package -- both `@whiteroom/engine` and `@whiteroom/llm-clients` depend on it.

## Install

```bash
npm install @whiteroom/shared
```

## Types

Core TypeScript interfaces used across all WhiteRoom packages:

```typescript
import type {
  AgentState,        // agent status, tokens, watch state, pairing
  FleetConfig,       // watch limit, rest duration
  GovernanceDecision,// allow | compress | block | reroute
  PairedAgentState,  // paired agent's current status
  HandoverDocument,  // compressed context: decisions, state, pending, warnings
  AuditEvent,        // logged event with tokens, model, cost
  Workspace,         // tenant boundary (trial or permanent)
  AgentStatus,       // 'idle' | 'working' | 'resting'
  TaskTier,          // 'simple' | 'standard' | 'complex'
  EventType,         // 'agent.request' | 'watch.limit_hit' | ...
} from '@whiteroom/shared';
```

## Constants

```typescript
import {
  DEFAULT_WATCH_LIMIT_TOKENS,  // 100,000
  DEFAULT_REST_SECONDS,        // 60
  EVENT_TYPES,                 // { AGENT_REGISTERED, WATCH_STARTED, ... }
  TRIAL_TTL_HOURS,             // 24
  MAX_TASKS_FOR_COMPRESSION,   // 20
} from '@whiteroom/shared';
```

## Pricing

Token cost calculation for supported models:

```typescript
import { calculateCostCents, MODEL_PRICING, TIER_MODEL_MAP } from '@whiteroom/shared';

// Calculate cost for 10K input + 2K output tokens on Sonnet
const cents = calculateCostCents(10000, 2000, 'claude-sonnet-4-5');

// Model tier mapping: simple -> Haiku, standard -> Sonnet, complex -> Opus
console.log(TIER_MODEL_MAP.simple); // 'claude-haiku-4-5'
```

Supported models: `claude-opus-4-7`, `claude-sonnet-4-5`, `claude-haiku-4-5`, `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `gpt-4.1-mini`.

## ID Generation

```typescript
import { generateId, generateTrialToken, generateApiKey } from '@whiteroom/shared';

generateId();          // 'V1StGXR8_Z5jdHi6B-myT' (21 chars, for DB primary keys)
generateTrialToken();  // 'x9k2p3' (6 chars, unambiguous alphabet)
generateApiKey();      // 'wr_a8f3...' (prefixed, 32 random chars)
```

## Compression

Build the LLM prompt for handover document generation:

```typescript
import { COMPRESSION_SYSTEM_PROMPT, buildCompressionMessages } from '@whiteroom/shared';

const messages = buildCompressionMessages(taskHistory);
// Use COMPRESSION_SYSTEM_PROMPT as system prompt, messages as user input
```

## License

[BSL 1.1](https://github.com/guideage/whiteroom/blob/main/LICENSE) -- converts to Apache 2.0 after 4 years.

Built by [Guideage](https://guideage.ai).
