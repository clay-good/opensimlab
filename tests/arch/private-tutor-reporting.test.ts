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
const tutorSurfaceFiles = tutorFiles.concat(sourceFiles.filter((file) => [
  'src/modules/anesthesia/ui/TutorRegion.tsx',
  'src/modules/anesthesia/ui/Debrief.tsx',
  'src/modules/anesthesia/ui/GoalRecommendation.tsx',
  'src/modules/anesthesia/catalog/practice-history.ts',
  'src/modules/anesthesia/catalog/recommendation-state.ts',
].includes(file.path)));

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
    /\binput(?:\??\.[A-Za-z_$][\w$]*)+\s*(?:=(?!=)|\+\+|--)/,
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

function tutorNetworkViolations(file: SourceFile): string[] {
  const forbidden = [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bsendBeacon\s*\(/,
  ];
  return forbidden
    .filter((pattern) => pattern.test(file.text))
    .map((pattern) => `matches network primitive ${pattern}`);
}

function incentiveViolations(file: SourceFile): string[] {
  const forbidden = [
    /\bleaderboards?\b/i,
    /\b(?:daily|weekly|practice)\s+streaks?\b/i,
    /\b(?:cross[- ]learner|learner)\s+percentiles?\b/i,
    /\b(?:earn|award|gain|lose|lost)\w*\s+(?:\d+\s+)?points?\b/i,
    /\bpublic\s+(?:performance|score|result|ranking)\b/i,
    /\b(?:points|score|reward)\w*.{0,80}\b(?:fast(?:er|est)?|speed)\b|\b(?:fast(?:er|est)?|speed)\w*.{0,80}\b(?:points|score|reward)\b/is,
  ];
  return forbidden
    .filter((pattern) => pattern.test(file.text))
    .map((pattern) => `matches prohibited incentive ${pattern}`);
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
    expect(tutorViolations({ path: 'read-only.ts', text: "input.scenarioId === 'example'; input.state.map == 40;" })).toEqual([]);
    expect(tutorViolations({ path: 'mutation.ts', text: 'input.state.map++;' })).toHaveLength(1);
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

  it('keeps tutor, history, recommendation, and debrief surfaces offline', () => {
    expect(tutorSurfaceFiles.length).toBeGreaterThan(0);
    for (const file of tutorSurfaceFiles) {
      expect(tutorNetworkViolations(file), file.path).toEqual([]);
    }
  });

  it('rejects network primitives from a tutor surface', () => {
    expect(tutorNetworkViolations({
      path: 'src/modules/example/tutor/hostile.ts',
      text: "fetch('/coach'); new WebSocket('wss://coach.invalid'); navigator.sendBeacon('/score');",
    })).toHaveLength(3);
  });

  it('prohibits distorted learner incentives from shipped source and copy', () => {
    for (const file of sourceFiles) {
      expect(incentiveViolations(file), file.path).toEqual([]);
    }
  });

  it('detects leaderboard, streak, comparison, points, and speed-reward mechanics', () => {
    expect(incentiveViolations({
      path: 'src/modules/example/hostile.tsx',
      text: 'Leaderboard · daily streak · learner percentile · earn 50 points · public performance · speed reward',
    })).toHaveLength(6);
  });

  it('keeps the learner-facing boundary explicit where performance is discussed', () => {
    const debrief = sourceFiles.find((file) => file.path === 'src/modules/anesthesia/ui/Debrief.tsx')!.text;
    const review = sourceFiles.find((file) => file.path === 'src/routes/ReviewRoute.tsx')!.text;
    const tutor = sourceFiles.find((file) => file.path === 'src/modules/anesthesia/ui/TutorRegion.tsx')!.text;
    expect(debrief).toContain('There is no overall score, no pass or fail, and no comparison with anyone else.');
    expect(review).toContain('There is no ranking of learners here and there will not be one');
    expect(tutor).toContain('works entirely on this device');
  });
});
