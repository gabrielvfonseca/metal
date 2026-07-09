import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/schema/index.ts', 'src/client/index.ts', 'src/query/index.ts', 'src/config/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['neo4j-driver', 'zod'],
  banner: {
    js: '// @metal/core - Prisma-like DX for graph databases',
  },
});