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
    // 216,000 times per guidance level, and they are not uniform: the
    // hypokalemia file's slowest test measures 19.7s on an idle machine while
    // the hypernatremia file's measures 80.8s. An earlier fix here set 180s
    // from the 19.7s figure alone and failed within two runs, because that
    // number was measured on the wrong file. Under external machine load the
    // 80.8s test has been observed at 368.4s, a 4.6x contention factor, and a
    // sibling test passed at 163.8s in the same run. 600s absorbs that
    // contention on the measured worst case while still catching a hang. The
    // durable fix is making the replays cheaper without weakening the
    // frame-by-frame determinism they prove; that is a separate change, and
    // raising this number again instead of making it would be the wrong
    // instinct. It is now measured rather than guessed at. Interleaved
    // best-of-6 over 1,500 ticks of the renal hyponatremia scenario:
    //
    //   engine.step() alone                       1.111 ms/tick
    //   step + JSON.stringify(frame) + sha256     1.988 ms/tick
    //
    // So 44% of a replay is serializing a 16 KB frame every tick — and that
    // serialization IS the proof, because the hash deliberately covers every
    // state field and waveform sample rather than a reduced endpoint
    // projection. The cheap win and the thing being proven are the same object,
    // so a real fix has to come from the 56% in the solver. Anyone tempted to
    // hash less should read the run() helper in a *-runs.test.ts file first.
    testTimeout: 600_000,
    // This is the only timeout in the suite, deliberately. Seventy-seven tests
    // used to carry their own 120s override, plus one at 240s and one at 420s,
    // all of them below this number and therefore the binding constraint under
    // load — which is the same "measured on the wrong file" mistake described
    // above, repeated per test instead of per config. They were removed rather
    // than raised: a run that fails here now fails against a figure derived from
    // the slowest measured replay and its observed 4.6x contention factor, not
    // against a leftover guess. If a specific test genuinely needs a tighter
    // bound as an assertion about its own speed, say that in the test's name.
    // A dozen integration files each step the solver for minutes of CPU. Left
    // unbounded, the pool spawns more workers than this machine has cores, and
    // those files miss their own timeouts through contention rather than any
    // real regression. Leave the scheduler headroom instead.
    maxWorkers: Math.max(2, availableParallelism() - 2),
  },
});
