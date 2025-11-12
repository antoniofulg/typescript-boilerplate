import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import path from 'path';

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.interface.ts',
        '**/*.dto.ts',
        '**/main.ts',
        '**/*.module.ts',
        '**/test-utils.ts',
        '**/*.config.*',
      ],
      reportsDirectory: './coverage',
    },
    pool: 'threads',
    isolate: true,
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '^src/(.*)$': path.resolve(__dirname, './src/$1'),
    },
  },
});
