import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * The identifier this build reports, read by `@platform/governance/status`.
 *
 * A build date and the commit it came from, because this project has no staged
 * version ladder to name a release after. A source export with no git history
 * still builds and says so.
 */
function releaseId(): string {
  const date = new Date().toISOString().slice(0, 10);
  let commit = 'unknown';
  try {
    commit = execFileSync('git', ['rev-parse', '--short=10', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    // No git available or no repository: the date alone still identifies the build.
  }
  return `${date}+${commit}`;
}

// The simulator remains a portable static build. Anonymous problem reports use
// a separately deployed exact-route Worker and lazy Turnstile client.
export default defineConfig({
  plugins: [react()],
  define: { __RELEASE_ID__: JSON.stringify(releaseId()) },
  resolve: {
    alias: {
      '@platform': r('./src/platform'),
      '@anesthesia': r('./src/modules/anesthesia'),
      '@routes': r('./src/routes'),
      '@landing': r('./src/landing'),
    },
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    // The budget gate follows this manifest so the interactive ceiling measures
    // the files a learner actually downloads to enter a lab, not every lazy
    // documentation and review route in the complete offline artifact.
    manifest: true,
    cssCodeSplit: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Share only the live hero's ECG dependencies with the cockpit. Grouping
          // the entire directory also loads arterial, capnogram, and pleth generators
          // on the landing route. Those remain in the lazy, fully precached cockpit.
          if (/src\/modules\/anesthesia\/waveforms\/(ecg|rhythms|types)\.ts$/.test(id)) return 'waveforms';
          return undefined;
        },
      },
    },
  },
});
