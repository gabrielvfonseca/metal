# Architecture

Metal follows a layered architecture inspired by Prisma and Drizzle.

## Layers

### 1. Schema DSL (`packages/core/src/schema`)

User-facing API for defining graph schemas. Uses the builder pattern:

```
node('User') → .add() → .build() → NodeConfig
schema() → .add() → .rel() → .build() → MetalSchemaRegistry
```

### 2. Cypher Compiler (`packages/core/src/query`)

Compiles Metal operations (find, create, update, delete, include) into Cypher queries and parameters. Type-safe via generics over `NodeConfig`.

### 3. Client (`packages/core/src/client`)

`MetalClient` wraps a `DriverAdapter` and schema registry. Provides high-level CRUD methods that delegate to the compiler.

### 4. Driver Adapter (`packages/neo4j-driver`)

`createNeo4jDriver` implements the `DriverAdapter` interface using the official Neo4j JavaScript driver. Abstracts connection management and query execution.

### 5. CLI (`cli/`)

`@metal/cli` provides `metal init` (scaffolding) and `metal generate` (code generation from schema).

### 6. Zod Integration (`packages/zod`)

Generates zod validation schemas from Metal node configs when `output.zod: true`.

## Data Flow

```
User Schema (schema.ts)
    ↓
metal generate
    ↓
Generated Types + Client (src/__generated__/)
    ↓
Application Code
    ↓
MetalClient (driver + schema registry)
    ↓
Cypher Compiler (query compilation)
    ↓
Neo4j Driver (query execution)
    ↓
Neo4j Database
```

## Type Safety

- Schema → NodeConfig → TypeScript interfaces (via code generation)
- Queries → CompiledQuery (typed params and results)
- Client methods → Generic over node label, return inferred node shape
- Environment → `env` from `@t3-oss/env-core` + zod (runtime validation)

## Project Structure

```
metal/
├── cli/                    # @metal/cli — scaffolding + codegen
├── packages/core/          # @metal/core — schema, compiler, client, config
├── packages/neo4j-driver/  # @metal/neo4j-driver — driver adapter
├── packages/zod/           # @metal/zod — zod validation
├── examples/social-graph/  # End-to-end demo
└── docs/                   # Documentation
```
