# Metal — Prisma-like DX for Graph Databases

Metal is a TypeScript OGM (Object-Graph Mapper) for graph databases, starting with Neo4j. It provides a schema DSL, Cypher query compiler, type-safe client, and CLI tooling for init and code generation.

## Project Layout

```
metal/
├── cli/                  # @metal/cli — metal init / metal generate
├── packages/
│   ├── core/             # @metal/core — schema DSL, Cypher compiler, client, config
│   ├── neo4j-driver/     # @metal/neo4j-driver — Neo4j DriverAdapter
│   └── zod/              # @metal/zod — Zod validation integration
├── examples/
│   └── social-graph/     # End-to-end example app
├── docs/                 # This documentation
├── biome.json            # Biome formatter + lint config
├── turbo.json            # Turborepo pipeline config
├── tsconfig.base.json    # Base TypeScript config
└── pnpm-workspace.yaml   # pnpm workspace definition
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm 9 (corepack enable recommended)
- A running Neo4j instance (local or remote)

### Installation

```bash
git clone https://github.com/gabrielvfonseca/metal.git
cd metal
pnpm install
pnpm build
```

### Initialize a New Project

```bash
npx @metal/cli init my-graph
cd my-graph
pnpm install
cp .env.example .env
# Edit .env with your Neo4j connection details
pnpm typecheck
npx tsx src/index.ts
```

## Configuration

### Environment Variables

All environment variables are validated through `@t3-oss/env-core` + zod in `packages/core/src/config/keys.ts`. Export `env` from `@metal/core`:

```ts
import { env } from '@metal/core';

console.log(env.NEO4J_URI);      // bolt://localhost:7687 (default)
console.log(env.NEO4J_USER);     // neo4j (default)
console.log(env.NEO4J_PASSWORD); // password (default)
console.log(env.NEO4J_DATABASE); // optional
console.log(env.METAL_DEBUG);    // boolean, from METAL_DEBUG=true
```

| Variable | Type | Default | Required |
|---|---|---|---|
| `NEO4J_URI` | string | `bolt://localhost:7687` | No |
| `NEO4J_USER` | string | `neo4j` | No |
| `NEO4J_PASSWORD` | string | `password` | No |
| `NEO4J_DATABASE` | string \| undefined | `undefined` | No |
| `METAL_DEBUG` | boolean | `false` | No |

### metal.config.ts

```ts
import { defineConfig, env } from '@metal/core';

export default defineConfig({
  schema: './src/schema.ts',
  output: {
    directory: './src/__generated__',
    zod: false,
  },
  driver: {
    type: 'neo4j',
    uri: env.NEO4J_URI,
    username: env.NEO4J_USER,
    password: env.NEO4J_PASSWORD,
    database: env.NEO4J_DATABASE,
  },
  debug: env.METAL_DEBUG,
  exclude: [],
});
```

## Schema DSL

Define your graph schema with the `node`, `defineRel`, and `schema` helpers:

```ts
import { node, defineRel, schema, string, number, date } from '@metal/core';

const User = node('User')
  .add('id', string({ primary: true }))
  .add('name', string())
  .add('email', string({ unique: true }))
  .add('createdAt', date({ default: () => new Date() }))
  .build();

const Post = node('Post')
  .add('id', string({ primary: true }))
  .add('title', string())
  .add('content', string())
  .build();

const AUTHORS = defineRel('AUTHORS', 'User', 'Post')
  .add('createdAt', date({ default: () => new Date() }))
  .build();

const graph = schema()
  .add('User', User)
  .add('Post', Post)
  .rel('AUTHORS', AUTHORS)
  .build();
```

## Client

```ts
import { MetalClient } from '@metal/core';
import { createNeo4jDriver } from '@metal/neo4j-driver';
import { graph } from './schema.js';

const driver = createNeo4jDriver({
  uri: env.NEO4J_URI,
  username: env.NEO4J_USER,
  password: env.NEO4J_PASSWORD,
});
await driver.connect();

const client = new MetalClient(driver, graph);

const users = await client.findMany('User', { limit: 10 });
await client.disconnect();
```

## CLI

### `metal init <directory>`

Scaffolds a new Metal project with schema, config, env example, and entrypoint.

### `metal generate`

Generates types and client code from your schema. Supports `--watch` for auto-regeneration.

## Development

```bash
pnpm install        # Install all workspace dependencies
pnpm build          # Build all packages
pnpm dev            # Watch mode for all packages
pnpm test           # Run all tests
pnpm test:ci        # Run tests (verbose CI reporter)
pnpm test:coverage  # Run tests with coverage
pnpm lint           # Biome + Ultracite check
pnpm format         # Biome + Ultracite fix
pnpm format:check   # Biome + Ultracite check
pnpm typecheck      # TypeScript typecheck across all packages
pnpm clean          # Clean all dist, .turbo, coverage dirs
```

## Releasing

This project uses [changesets](https://github.com/changesets/changesets) for versioning and publishing.

```bash
pnpm changeset   # Add a changeset for user-facing changes
pnpm version     # Version packages based on changesets
pnpm release     # Build and publish
```

## License

MIT
