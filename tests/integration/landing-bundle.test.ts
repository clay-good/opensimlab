import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

describe('landing waveform bundle boundary', () => {
  it('loads the live ECG without the cockpit-only generators and retains each generator for the cockpit', async () => {
    // Use the real Vite chunk configuration without replacing dist or its offline
    // cache. Vitest keeps NODE_ENV=test: this checks module ownership, not release
    // byte size, which the separate production build and budget gate verify.
    const result = await build({ configFile: fileURLToPath(new URL('../../vite.config.ts', import.meta.url)),
      logLevel: 'silent', build: { write: false },
    });
    const chunks = (Array.isArray(result) ? result : [result])
      .flatMap((output) => 'output' in output ? output.output : [])
      .filter((output) => output.type === 'chunk');
    const entry = chunks.find((chunk) => chunk.isEntry)!;
    // The cockpit is reached through a module route now, not one shared file.
    const cockpit = chunks.find((chunk) => chunk.facadeModuleId?.endsWith('/src/routes/modules/anesthesia.tsx'))!;
    expect(entry).toBeDefined(); expect(cockpit).toBeDefined();
    const modulesFor = (fileName: string) => {
      const modules = new Set<string>(); const seen = new Set<string>();
      const visit = (file: string) => {
        if (seen.has(file)) return;
        seen.add(file);
        const chunk = chunks.find((candidate) => candidate.fileName === file);
        expect(chunk, `Missing built import ${file}`).toBeDefined();
        for (const id of Object.keys(chunk!.modules)) modules.add(id);
        for (const imported of chunk!.imports) visit(imported);
      };
      visit(fileName); return [...modules];
    };
    const landingModules = modulesFor(entry.fileName); const cockpitModules = modulesFor(cockpit.fileName);
    for (const file of ['ecg.ts', 'rhythms.ts', 'types.ts']) {
      expect(landingModules.some((id) => id.endsWith(`/waveforms/${file}`)), `Landing retains ${file}`).toBe(true);
    }
    for (const file of ['index.ts', 'arterial.ts', 'capnogram.ts', 'pleth.ts']) {
      expect(landingModules.some((id) => id.endsWith(`/waveforms/${file}`)), `Landing must not load ${file}`).toBe(false);
      expect(cockpitModules.some((id) => id.endsWith(`/waveforms/${file}`)), `Cockpit retains ${file}`).toBe(true);
    }
    for (const file of ['ecg.ts', 'rhythms.ts', 'types.ts', 'index.ts', 'arterial.ts', 'capnogram.ts', 'pleth.ts']) {
      expect(chunks.filter((chunk) => Object.keys(chunk.modules).some((id) => id.endsWith(`/waveforms/${file}`))),
        `No duplicated main-thread waveform module: ${file}`).toHaveLength(1);
    }
    expect(landingModules.some((id) => /\/src\/modules\/[^/]+\/scenarios\//.test(id))).toBe(false);
  });
});
