import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { availableParallelism } from 'node:os';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@platform': r('./src/platform'),
      '@anesthesia': r('./src/modules/anesthesia'),
      '@routes': r('./src/routes'),
      '@landing': r('./src/landing'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Default to node. DOM tests opt in with a `@vitest-environment jsdom` docblock.
    environment: 'node',
    globals: false,
    reporters: ['default'],
    // The engine tests run tens of thousands of solver steps deliberately; they
    // are the regression net, not unit-sized.
    testTimeout: 60_000,
    // A dozen integration files each step the solver for minutes of CPU. Left
    // unbounded, the pool spawns more workers than this machine has cores, and
    // those files miss their own timeouts through contention rather than any
    // real regression. Leave the scheduler headroom instead.
    maxWorkers: Math.max(2, availableParallelism() - 2),
  },
});
