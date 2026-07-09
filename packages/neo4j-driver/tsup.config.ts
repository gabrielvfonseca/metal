import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['neo4j-driver'],
  banner: {
    js: '// @metal/neo4j-driver - Neo4j driver adapter for Metal OGM',
  },
});