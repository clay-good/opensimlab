/**
 * Writes `src/platform/facilitation/reference-paths.generated.ts`.
 *
 * Run with `npm run reference-paths` after changing any lesson's reference
 * transcripts. `tests/unit/reference-paths.test.ts` fails when the committed
 * file no longer matches the fixtures, so a guide cannot show a facilitator an
 * expert path the lesson no longer takes.
 *
 * The fixtures are discovered rather than listed. There are 256 of them, and a
 * hand-written import list is one more thing to forget when a lesson is added;
 * `import.meta.glob` is not available here, because the prerender step that
 * consumes this runs under tsx rather than Vite.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODULES } from '@platform/modules/registry';
import { referencePath, type ReferencePaths } from '@platform/facilitation/reference-paths';
import { SCENARIOS } from '@anesthesia/scenarios';
import type { LearnerAction } from '@platform/kernel/protocol';
import { sampleExpertVitals } from './sample-expert-vitals';

const root = fileURLToPath(new URL('..', import.meta.url));

/** The one module whose lessons run a physiological model. */
const CLOSED_LOOP_MODULE = 'anesthesia';

interface FixtureObject {
  readonly scenarioId: string;
  readonly seed: number;
  readonly expert: readonly unknown[];
  readonly commonError: readonly unknown[];
  readonly recovery: readonly unknown[];
}

function isFixtureObject(value: unknown): value is FixtureObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.scenarioId === 'string' && typeof record.seed === 'number'
    && Array.isArray(record.expert)
    && Array.isArray(record.commonError) && Array.isArray(record.recovery);
}

async function pathsFor(moduleId: string): Promise<ReferencePaths[]> {
  const dir = join(root, 'src/modules', moduleId);
  const files = readdirSync(dir).filter((file) => file.endsWith('-fixtures.ts')).sort();
  const found: ReferencePaths[] = [];
  for (const file of files) {
    const namespace = await import(join(dir, file)) as Record<string, unknown>;
    const fixtures = Object.values(namespace).filter(isFixtureObject);
    if (fixtures.length !== 1) {
      throw new Error(`reference-paths: ${moduleId}/${file} exports ${fixtures.length} fixture objects, expected 1`);
    }
    const fixture = fixtures[0]!;
    // Only the closed-loop family has a model to replay. The others carry their
    // observations in each state's authored text, where they already are.
    const scenario = moduleId === CLOSED_LOOP_MODULE
      ? SCENARIOS.find((candidate) => candidate.metadata.id === fixture.scenarioId)
      : undefined;
    const expertVitals = scenario === undefined ? undefined
      : sampleExpertVitals(scenario, fixture.seed, fixture.expert as readonly LearnerAction[]);
    found.push({
      moduleId,
      scenarioId: fixture.scenarioId,
      expert: referencePath(fixture.expert),
      commonError: referencePath(fixture.commonError),
      recovery: referencePath(fixture.recovery),
      ...(expertVitals === undefined || expertVitals.length === 0 ? {} : { expertVitals }),
    });
  }
  return found;
}

const entries: ReferencePaths[] = [];
for (const module of MODULES.filter((candidate) => candidate.status === 'available')) {
  entries.push(...await pathsFor(module.id));
}

const step = (value: { tick: number; label: string; detail?: string }) =>
  `      { tick: ${value.tick}, label: ${JSON.stringify(value.label)}`
  + `${value.detail === undefined ? '' : `, detail: ${JSON.stringify(value.detail)}`} },`;

const lines = [
  '/**',
  ' * GENERATED FILE. Do not edit.',
  ' *',
  " * Written by `npm run reference-paths` from every lesson's checked-in fixtures.",
  ' * Editing it directly is the mistake; `tests/unit/reference-paths.test.ts` is',
  ' * what catches both that and a stale copy.',
  ' */',
  "import type { ReferencePaths } from './reference-paths';",
  '',
  'export const REFERENCE_PATHS: readonly ReferencePaths[] = [',
];
for (const entry of entries) {
  lines.push('  {');
  lines.push(`    moduleId: ${JSON.stringify(entry.moduleId)},`);
  lines.push(`    scenarioId: ${JSON.stringify(entry.scenarioId)},`);
  for (const key of ['expert', 'commonError', 'recovery'] as const) {
    lines.push(`    ${key}: [`);
    for (const value of entry[key]) lines.push(step(value));
    lines.push('    ],');
  }
  if (entry.expertVitals !== undefined) {
    lines.push('    expertVitals: [');
    for (const sample of entry.expertVitals) {
      const vitals = Object.entries(sample.vitals).map(([key, value]) => `${key}: ${value}`).join(', ');
      lines.push(`      { tick: ${sample.tick}, vitals: { ${vitals} } },`);
    }
    lines.push('    ],');
  }
  lines.push('  },');
}
lines.push('];', '');

writeFileSync(join(root, 'src/platform/facilitation/reference-paths.generated.ts'), lines.join('\n'), 'utf8');
process.stdout.write(`reference-paths: wrote ${entries.length} lessons\n`);
