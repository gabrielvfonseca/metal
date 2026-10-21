import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['zod', '@metal/core'],
  banner: {
    js: '// @metal/zod - Zod validation integration for Metal OGM',
  },
});
