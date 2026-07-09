import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['@metal/core', '@metal/neo4j-driver'],
  banner: {
    js: '#!/usr/bin/env node\n// @metal/cli - CLI for Metal OGM',
  },
});