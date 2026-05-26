# Changelog

All notable changes to WhiteRoom will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-05-26

### Added
- Pure governance engine (`@whiteroom/engine`) with watch/rest cycle enforcement
- `evaluateRequest()` -- core governance decision (allow, compress, block, reroute)
- `shouldFireAlarm()` -- safe alarm firing with paired agent check (fixes v1 bug)
- `estimateSavings()` -- real compounding formula for token savings (fixes v1 hardcoded formula)
- `pickAgentForTask()` -- skill-based agent selection
- `selectModelForTier()` -- tier-based model routing (simple -> Haiku, complex -> Opus)
- `watchProgress()` and `agentHealth()` for dashboard visualization
- Shared types and constants (`@whiteroom/shared`)
- LLM client wrappers for Anthropic, OpenAI, and OpenRouter (`@whiteroom/llm-clients`)
- Handover document injection for agent context resumption
- Token cost calculation for 7 models across 3 providers
- 63 tests across all packages
