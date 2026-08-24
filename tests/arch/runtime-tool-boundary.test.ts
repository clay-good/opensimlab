import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../src/routes/routes';

const root = fileURLToPath(new URL('../..', import.meta.url));

interface SourceFile { readonly path: string; readonly text: string }

function walk(dir: string, out: SourceFile[] = []): SourceFile[] {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git'].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx', '.js', '.json', '.toml'].includes(extname(full))) {
      out.push({ path: relative(root, full), text: readFileSync(full, 'utf8') });
    }
  }
  return out;
}

const sourceFiles = walk(join(root, 'src')).concat(walk(join(root, 'scripts')));
const utilityName = /(?:calculator|calculate|riskScore|scorePatient|classif(?:y|ication)|convert(?:er)?|lookup|checklistAnswer|generate(?:Clinical)?(?:Note|Document|Plan)|diagnos(?:e|is)|recommend(?:Dose|Treatment))/i;
const internalModelPath = /^src\/modules\/[^/]+\/(?:engine|physiology|pharmacology|region)(?:\/|\.)/;

function publicComputeViolations(file: SourceFile): string[] {
  const violations: string[] = [];
  if (!internalModelPath.test(file.path)) {
    for (const match of file.text.matchAll(/export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z_$][\w$]*)/g)) {
      if (utilityName.test(match[1] ?? '')) violations.push(`exports runtime utility ${match[1]}`);
    }
  }
  for (const match of file.text.matchAll(/['"`]\/api\/([^'"`?]*)/g)) {
    const endpoint = `/api/${match[1] ?? ''}`;
    if (endpoint !== '/api/reports' && endpoint !== '/api/reports/config') {
      violations.push(`exposes public compute endpoint ${endpoint}`);
    }
  }
  const realPatientInput = /(?:label|name|id|placeholder)=['"`][^'"`]*(?:patient\s*(?:name|id)|date of birth|medical record|current (?:lab|medication|measurement)|enter (?:a )?(?:dose|score|classification))/i;
  if (realPatientInput.test(file.text)) violations.push('offers arbitrary real-patient input');
  return violations;
}

describe('Requirement: Educational rehearsal never becomes a runtime work tool', () => {
  it('rejects standalone utility routes and utility-oriented search metadata', () => {
    const forbiddenRoute = /(?:calculator|score|classification|converter|lookup|checklist|dose-tool|decision-support|documentation-generator)/i;
    for (const route of ROUTES) {
      expect(route.path, `forbidden utility route ${route.path}`).not.toMatch(forbiddenRoute);
      expect(`${route.title} ${route.description}`, `utility-oriented metadata on ${route.path}`)
        .not.toMatch(/calculate for your patient|determine the dose|clinical decision support|use at the bedside/i);
    }
  });

  it('rejects exported utilities, real-patient fields, and public compute endpoints', () => {
    for (const file of sourceFiles) {
      expect(publicComputeViolations(file), file.path).toEqual([]);
    }
  });

  it('makes the boundary rules fail on every prohibited utility family', () => {
    const hostileExports = [
      'calculateDose', 'riskScore', 'classifyPatient', 'convertUnits', 'codeLookup',
      'checklistAnswer', 'generateClinicalNote', 'diagnosePatient', 'recommendTreatment',
    ];
    for (const name of hostileExports) {
      expect(publicComputeViolations({ path: 'src/platform/tools/hostile.ts', text: `export function ${name}() {}` }))
        .toEqual([`exports runtime utility ${name}`]);
    }
  });

  it('rejects arbitrary patient entry and compute APIs but permits exact report routes', () => {
    expect(publicComputeViolations({
      path: 'src/routes/Hostile.tsx',
      text: '<input name="patientName" />; fetch("/api/calculate-dose")',
    })).toEqual([
      'exposes public compute endpoint /api/calculate-dose',
      'offers arbitrary real-patient input',
    ]);
    expect(publicComputeViolations({
      path: 'src/platform/reporting/client.ts',
      text: 'fetch("/api/reports"); fetch("/api/reports/config")',
    })).toEqual([]);
  });

  it('keeps imports limited to strict Open Sim Lab JSON artifacts', () => {
    const review = readFileSync(join(root, 'src/routes/ReviewRoute.tsx'), 'utf8');
    expect(review).toContain('accept="application/json,.json"');
    expect(review).toContain('parseTranscript(text, file.name)');
    expect(sourceFiles.filter((file) => file.text.includes('type="file"')).map((file) => file.path))
      .toEqual(['src/routes/ReviewRoute.tsx']);
  });

  it('ships no general server, MCP surface, or package API', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as Record<string, unknown>;
    const wrangler = readFileSync(join(root, 'wrangler.toml'), 'utf8');
    expect(manifest.exports).toBeUndefined();
    expect(manifest.bin).toBeUndefined();
    expect(wrangler).not.toMatch(/^main\s*=/m);
    expect(sourceFiles.map((file) => file.path).filter((path) => /(?:^|\/)mcp(?:\.|\/)/i.test(path)))
      .toEqual([]);
  });

  it('permits calculations internal to the fictional patient model', () => {
    const engine = sourceFiles.find((file) => file.path === 'src/modules/anesthesia/engine.ts')!;
    const physiology = sourceFiles.find((file) => file.path === 'src/modules/anesthesia/physiology/index.ts')!;
    expect(engine.text).toContain('class AnesthesiaEngine');
    expect(physiology.text).toContain('class VirtualPatient');
    expect(physiology.text).toContain('stepGas(');
    expect(publicComputeViolations(engine)).toEqual([]);
    expect(publicComputeViolations(physiology)).toEqual([]);
  });
});
