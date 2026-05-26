# WhiteRoom

**Governance and audit layer for AI agent fleets.**

WhiteRoom sits between your AI agents and their LLM provider. It enforces work/rest cycles, compresses context via structured handover documents, routes tasks to the right model tier, and logs every decision in a compliance-grade audit trail.

**Add one environment variable. Cut your agent token costs ~80%. Get an audit log regulators will accept.**

## Production Results

| Metric | Value |
|--------|-------|
| Token reduction | 88% |
| Context compression per handover | 55% |
| Code changes needed | 0 |
| Setup time | 60 seconds |

## Quick Start

### Hosted (whiteroom.tech)

```bash
# Point your agent at WhiteRoom -- that's it
export ANTHROPIC_BASE_URL=https://api.whiteroom.tech/t/YOUR_TRIAL_TOKEN
```

Visit [whiteroom.tech](https://whiteroom.tech) and click "Try it instantly" to get a trial token.

### Self-Hosted

```bash
npm install @whiteroom/engine @whiteroom/shared
```

```typescript
import { evaluateRequest, estimateSavings } from '@whiteroom/engine';

const decision = evaluateRequest({
  agent: {
    agentId: 'my-agent',
    fleetId: 'my-fleet',
    skills: [],
    status: 'working',
    currentWatchTokens: 85000,
    watchStartedAt: new Date(),
    restUntil: null,
    pairedWith: null,
    inputTokens: 85000,
    outputTokens: 12000,
    callCount: 42,
  },
  fleet: {
    fleetId: 'my-fleet',
    watchLimitTokens: 100000,
    restSeconds: 60,
  },
  estimatedTokens: 8000,
  requestedModel: 'claude-sonnet-4-5',
});

if (decision.action === 'compress') {
  // Agent hit watch limit -- generate handover document
}
```

## How It Works

1. **Watch cycles** -- Each agent works for a set token budget (default: 100K tokens), then takes a mandatory rest
2. **Handover documents** -- At the end of each watch, context is compressed into a structured summary (decisions, state, pending tasks, warnings)
3. **Agent rotation** -- A relief agent picks up from the handover document, or the same agent resumes after rest (self-handover)
4. **Skill routing** -- Simple tasks get routed to cheaper models automatically

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@whiteroom/engine`](packages/engine) | Pure governance engine -- zero I/O, fully testable | [![npm](https://img.shields.io/npm/v/@whiteroom/engine)](https://www.npmjs.com/package/@whiteroom/engine) |
| [`@whiteroom/shared`](packages/shared) | Types, constants, pricing utilities | [![npm](https://img.shields.io/npm/v/@whiteroom/shared)](https://www.npmjs.com/package/@whiteroom/shared) |
| [`@whiteroom/llm-clients`](packages/llm-clients) | Anthropic, OpenAI, OpenRouter clients with handover injection | [![npm](https://img.shields.io/npm/v/@whiteroom/llm-clients)](https://www.npmjs.com/package/@whiteroom/llm-clients) |

## Supported LLM Providers

| Provider | Status | Setup |
|----------|--------|-------|
| Anthropic | Native | `ANTHROPIC_BASE_URL` |
| OpenAI / GPT | Works | `OPENAI_BASE_URL` |
| Groq / Together / Mistral | Works | Any OpenAI-compatible API |
| CrewAI | Tested | Set `ANTHROPIC_BASE_URL` before `crew.kickoff()` |
| LangChain | Works | Set base URL env var |

## Development

```bash
pnpm install
pnpm build
pnpm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[BSL 1.1](LICENSE) -- converts to Apache 2.0 after 4 years.

The governance engine (`packages/engine`, `packages/shared`, `packages/llm-clients`) is open source. The hosted proxy and dashboard are proprietary.

## Authors

- **Nyari Nain** -- MIT Sloan Fellows MBA 2026
- **Rashad Haque** -- MIT Sloan 15.S12

Built by [Guideage](https://guideage.ai).
