import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
