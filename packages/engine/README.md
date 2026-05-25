# @whiteroom/engine

Pure governance engine for AI agent fleets. Zero I/O, zero side effects — just functions.

## Install

```bash
npm install @whiteroom/engine @whiteroom/shared
```

## Usage

```typescript
import { evaluateRequest, shouldFireAlarm, estimateSavings } from '@whiteroom/engine';

const decision = evaluateRequest({
  agent: { agentId: 'a1', status: 'working', currentWatchTokens: 95000, /* ... */ },
  fleet: { fleetId: 'f1', watchLimitTokens: 100000, restSeconds: 60 },
  estimatedTokens: 8000,
  requestedModel: 'claude-sonnet-4-5',
});

// decision.action: 'allow' | 'compress' | 'block' | 'reroute'
```

## Functions

| Function | Purpose |
|----------|---------|
| `evaluateRequest()` | Core governance decision — allow, compress, block, or reroute |
| `shouldFireAlarm()` | Check if a resting agent should wake (respects paired agent status) |
| `estimateSavings()` | Calculate token savings from handover compression |
| `pickAgentForTask()` | Select best agent by skill match and utilization |
| `watchProgress()` | Current watch completion percentage |
| `agentHealth()` | Agent health score (20-100) |
| `selectModelForTier()` | Route simple tasks to cheaper models |

## License

BSL 1.1 — converts to Apache 2.0 after 4 years.
