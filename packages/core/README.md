# @metal/core

The heart of Metal: schema DSL, Cypher query compiler, typed client, and config system.

```ts
import { node, relation, schema, string, MetalClient } from '@metal/core';

export const User = node('User')
  .add('id', string({ primary: true }))
  .add('name', string())
  .add('posts', relation('POSTED', 'OUT', 'Post', { multiple: true }))
  .build();

const client = new MetalClient(driver, { User });
const users = await client.findMany('User', { include: { posts: true } });
```

## Subpath exports

- `@metal/core` — everything
- `@metal/core/schema` — schema builders only
- `@metal/core/client` — `MetalClient` / `MetalTransaction`
- `@metal/core/query` — `QueryCompiler`
- `@metal/core/config` — `defineConfig` / `loadConfig`

## Testing

```bash
pnpm test
```

The query compiler is fully unit-tested. For integration tests against Neo4j, set `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD`.

## License

MIT
