import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../..', import.meta.url));

interface SourceFile {
  readonly path: string;
  readonly text: string;
}

function walk(dir: string, out: SourceFile[] = []): SourceFile[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx'].includes(extname(full))) {
      out.push({ path: relative(root, full), text: readFileSync(full, 'utf8') });
    }
  }
  return out;
}

const tutorFiles = walk(join(root, 'src', 'platform', 'tutor'))
  .concat(walk(join(root, 'src', 'modules')).filter((file) => file.path.includes('/tutor/')));
const reportingFiles = walk(join(root, 'src', 'platform', 'reporting'));
const sourceFiles = walk(join(root, 'src'));

const importedSpecifiers = (text: string): string[] => [...text.matchAll(
  /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
)].map((match) => match[1] ?? '');

function tutorViolations(file: SourceFile): string[] {
  const violations: string[] = [];
  const forbiddenImport = /^(?:@platform\/(?:session|offline)|@anesthesia\/(?:engine|physiology|pharmacology|waveforms))(?:\/|$)/;
  for (const specifier of importedSpecifiers(file.text)) {
    if (forbiddenImport.test(specifier)) violations.push(`imports mutation-capable module ${specifier}`);
  }
  const forbiddenOperations = [
    /\b(?:dispatch|postMessage|setState)\s*\(/,
    /\binput(?:\??\.[A-Za-z_$][\w$]*)+\s*(?:=|\+\+|--)/,
    /\b(?:localStorage|sessionStorage|indexedDB)\b/,
  ];
  for (const pattern of forbiddenOperations) {
    if (pattern.test(file.text)) violations.push(`matches forbidden operation ${pattern}`);
  }
  return violations;
}

function reportingViolations(file: SourceFile): string[] {
  const violations: string[] = [];
  const privateImport = /^(?:@platform\/(?:offline|session|transcript)|@anesthesia\/debrief)(?:\/|$)/;
  for (const specifier of importedSpecifiers(file.text)) {
    if (privateImport.test(specifier)) violations.push(`imports private learner data ${specifier}`);
  }
  const forbiddenReads = [
    /\b(?:localStorage|sessionStorage|indexedDB)\b/,
    /\b(?:Storage|IDBDatabase)\b/,
    /\bdocument\.cookie\b/,
    /\b(?:reflection|progress|priorSessions?|localHistory|importedFiles?)\b/i,
    /['"]opensimlab\./,
  ];
  for (const pattern of forbiddenReads) {
    if (pattern.test(file.text)) violations.push(`matches private-data read ${pattern}`);
  }
  return violations;
}

describe('Requirement: Tutor and reporting boundaries are structural', () => {
  it('keeps every tutor rule outside patient mutation paths', () => {
    expect(tutorFiles.length).toBeGreaterThan(0);
    for (const file of tutorFiles) {
      expect(tutorViolations(file), file.path).toEqual([]);
    }
  });

  it('rejects mutation-capable tutor dependencies and writes to tutor input', () => {
    expect(tutorViolations({
      path: 'src/modules/example/tutor/hostile.ts',
      text: "import { AnesthesiaEngine } from '@anesthesia/engine';\ninput.state.map = 40;",
    })).toHaveLength(2);
  });

  it('keeps reporting unable to discover browser storage or private learner records', () => {
    for (const file of reportingFiles) {
      expect(reportingViolations(file), file.path).toEqual([]);
    }
  });

  it('reserves report-service access for the isolated reporting package', () => {
    for (const file of sourceFiles.filter((candidate) => !candidate.path.startsWith('src/platform/reporting/'))) {
      expect(file.text, `${file.path} reaches the report service outside its boundary`)
        .not.toMatch(/['"`]\/api\/reports(?:\/config)?(?:['"`?])/);
    }
  });

  it('rejects reporting imports and direct reads of arbitrary browser storage', () => {
    expect(reportingViolations({
      path: 'src/platform/reporting/hostile.ts',
      text: "import { inventory } from '@platform/offline/local-data';\nlocalStorage.getItem('opensimlab.progress');",
    })).toHaveLength(4);
  });
});
