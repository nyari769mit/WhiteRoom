# Contributing to WhiteRoom

Thanks for your interest in contributing to WhiteRoom.

## OSS Scope

The following packages are open source under the BSL 1.1 license:

- `packages/engine` -- Pure governance engine (zero I/O)
- `packages/shared` -- Types, constants, utilities
- `packages/llm-clients` -- LLM provider wrappers

The proxy (`apps/proxy`) and dashboard (`apps/dashboard`) are proprietary.

## Development Setup

```bash
# Clone and install
git clone https://github.com/guideage/whiteroom.git
cd whiteroom
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type-check
pnpm typecheck
```

## Making Changes

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes in the relevant `packages/` directory
4. Add or update tests -- `packages/engine` targets >95% coverage
5. Run `pnpm test` and `pnpm typecheck` to verify
6. Submit a pull request against `main`

## Code Style

- TypeScript strict mode
- No I/O in `packages/engine` -- pure functions only
- Formatting handled by Prettier (runs on pre-commit)
- Linting via ESLint

## Reporting Issues

Open an issue on GitHub. Include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your Node.js version and OS

## License

By contributing, you agree that your contributions will be licensed under the BSL 1.1 license.
