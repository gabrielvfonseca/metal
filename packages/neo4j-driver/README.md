# @metal/neo4j-driver

Neo4j driver adapter for Metal OGM. Wraps the official [`neo4j-driver`](https://github.com/neo4j/neo4j-javascript-driver) and implements `DriverAdapter` from `@metal/core`.

```ts
import { MetalClient } from '@metal/core';
import { createNeo4jDriver } from '@metal/neo4j-driver';

const driver = createNeo4jDriver({
  uri: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'password',
  database: 'neo4j', // optional
});
await driver.connect();

const client = new MetalClient(driver, graph);
```

## Features

- Connection pooling with configurable timeouts
- `runQuery`, `runInTransaction` (`executeWrite`), `runInReadTransaction` (`executeRead`)
- Result normalization (records, counters, notifications, timings)

## License

MIT
