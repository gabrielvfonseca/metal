import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['@metal/core', '@metal/neo4j-driver'],
  banner: { js: '#!/usr/bin/env node' },
  define: {
    __METAL_CLI_VERSION__: JSON.stringify(pkg.version),
  },
});
