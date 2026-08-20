import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Static build only. No server, no runtime function, no foreign origin.
// See platform/delivery and platform/privacy.
export default defineConfig({
  plugins: [react()],
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
    cssCodeSplit: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // The waveform generator is shared: the landing hero uses it and so does
          // the cockpit. It must NOT sit in the anesthesia chunk, or the landing
          // route would pull the whole simulator in with it.
          if (id.includes('src/modules/anesthesia/waveforms')) return 'waveforms';
          if (id.includes('src/modules/anesthesia')) return 'anesthesia';
          if (id.includes('node_modules/react')) return 'react';
          return undefined;
        },
      },
    },
  },
});
