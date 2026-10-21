import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __METAL_CLI_VERSION__: JSON.stringify('0.1.0'),
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['tests/**'],
    },
  },
});
