# @metal/cli

CLI for Metal OGM.

```bash
npx metal init [directory]   # scaffold a new project
npx metal generate           # generate types/client (and zod) from schema
npx metal generate --watch   # regenerate on schema changes
```

Reads `metal.config.ts` (or `metal.config.json`) for the schema path, output directory, zod flag, and excluded labels.

Generated files land in `src/__generated__` by default:

- `types.ts` — node interfaces, `Where`, `CreateInput`, `UpdateInput` types
- `client.ts` — `createClient()` factory wiring `@metal/neo4j-driver` to `MetalClient`
- `zod.ts` — Zod schemas (when `output.zod: true`)

## License

MIT
