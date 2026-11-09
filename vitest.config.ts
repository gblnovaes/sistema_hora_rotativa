import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const alias = {
  '@domain': resolve('src/domain'),
  '@application': resolve('src/application'),
  '@infrastructure': resolve('src/infrastructure'),
  '@shared': resolve('src/shared'),
  '@presentation': resolve('src/renderer/src/presentation'),
};

export default defineConfig({
  resolve: { alias },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/domain/**', 'src/application/**'],
      thresholds: {
        'src/domain/**': { statements: 95, branches: 95, functions: 95, lines: 95 },
        'src/application/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
      },
    },
  },
});
