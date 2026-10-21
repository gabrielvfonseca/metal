# Contributing Guide

## Getting Started

```bash
git clone https://github.com/gabrielvfonseca/metal.git
cd metal
pnpm install
pnpm build
pnpm test
```

Requirements: Node.js ≥ 20, pnpm 9 (`corepack enable` recommended).

## Workflow

1. Create a feature branch from `master`.
2. Make your changes with tests.
3. Run the full gate before opening a PR:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

4. Add a changeset for user-facing changes:

   ```bash
   pnpm changeset
   ```

5. Open a pull request.

## Code Style

- TypeScript strict mode; tests are typechecked too.
- Biome + Ultracite. `pnpm format` before committing.
- Prefer pure functions in the query compiler — every compile method should be unit-tested with string/param assertions.
- No `any` in public APIs; internal `any` is tolerated but minimize it.
- All environment access goes through `env` from `@t3-oss/env-core` — never `process.env` directly.

## Project Layout

- `cli/` — `@metal/cli` — `metal init` / `metal generate`
- `packages/core/` — `@metal/core` — schema DSL, Cypher compiler, client, config
- `packages/neo4j-driver/` — `@metal/neo4j-driver` — Neo4j DriverAdapter
- `packages/zod/` — `@metal/zod` — Zod validation integration
- `examples/social-graph/` — end-to-end example app
- `docs/` — documentation (uppercase snake_case file names)

## Reporting Bugs

Open an issue with a minimal reproduction. For security issues, see `SECURITY.md`.

## License

MIT
