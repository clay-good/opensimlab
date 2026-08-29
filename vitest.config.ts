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
    // are the regression net, not unit-sized. The replay files step the solver
    // 216,000 times per guidance level and the slowest single test measures
    // 19.7s on an idle machine, so 60s left only a 3x margin. Under ordinary
    // machine load that same test measured 99.1s and reported as a failure
    // even though nothing had regressed. A false failure here is worse than a
    // slow one, because it teaches you to dismiss this file's output. 180s sits
    // comfortably above the worst observed run while still catching a hang.
    testTimeout: 180_000,
    // A dozen integration files each step the solver for minutes of CPU. Left
    // unbounded, the pool spawns more workers than this machine has cores, and
    // those files miss their own timeouts through contention rather than any
    // real regression. Leave the scheduler headroom instead.
    maxWorkers: Math.max(2, availableParallelism() - 2),
  },
});
