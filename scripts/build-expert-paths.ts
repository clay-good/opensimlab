/**
 * Writes `src/modules/anesthesia/debrief/expert-paths.generated.ts`.
 *
 * Run with `npm run expert-paths` after changing any closed-loop lesson's
 * reference transcripts. `tests/unit/expert-paths.test.ts` fails when the
 * committed file no longer matches the fixtures, so the debrief cannot draw an
 * expert path the lesson no longer takes.
 *
 * WHY A SECOND GENERATED FILE, when `reference-paths.generated.ts` already
 * carries every lesson's expert transcript. That one is written for the
 * facilitator guide: its steps are labels and formatted payloads for a person
 * to read, not actions an engine can apply, and it carries all 256 lessons at
 * 7,400 lines. The debrief needs the opposite - the 39 lessons that have a
 * model, as replayable actions - and it lives in the cockpit chunk, which
 * every learner downloads. Pulling the guide's file in there would ship 217
 * lessons' prose to draw 39 lessons' traces.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENARIOS } from '@anesthesia/scenarios';
import type { LearnerAction } from '@platform/kernel/protocol';
import { sampleExpertVitals } from './sample-expert-vitals';

const root = fileURLToPath(new URL('..', import.meta.url));

/** The one module whose lessons run a physiological model. */
const CLOSED_LOOP_MODULE = 'anesthesia';

interface FixtureObject {
  readonly scenarioId: string;
  readonly seed: number;
  readonly ticks?: number;
  readonly expert: readonly unknown[];
}

function isFixtureObject(value: unknown): value is FixtureObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.scenarioId === 'string' && typeof record.seed === 'number'
    && Array.isArray(record.expert);
}

/** An engine action, or nothing when the fixture element is a tray step id. */
function action(entry: unknown): LearnerAction | undefined {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return undefined;
  const record = entry as Record<string, unknown>;
  return typeof record.tick === 'number' && typeof record.type === 'string'
    ? (entry as LearnerAction) : undefined;
}

const dir = join(root, 'src/modules', CLOSED_LOOP_MODULE);
const files = readdirSync(dir).filter((file) => file.endsWith('-fixtures.ts')).sort();
const entries: {
  scenarioId: string; seed: number; ticks: number;
  expert: readonly LearnerAction[];
  recorded: ReturnType<typeof sampleExpertVitals>;
}[] = [];

for (const file of files) {
  const namespace = await import(join(dir, file)) as Record<string, unknown>;
  const fixtures = Object.values(namespace).filter(isFixtureObject);
  if (fixtures.length !== 1) {
    throw new Error(`expert-paths: ${file} exports ${fixtures.length} fixture objects, expected 1`);
  }
  const fixture = fixtures[0]!;
  const scenario = SCENARIOS.find((candidate) => candidate.metadata.id === fixture.scenarioId);
  if (scenario === undefined) throw new Error(`expert-paths: no scenario for ${fixture.scenarioId}`);
  const expert = fixture.expert.map(action).filter((value): value is LearnerAction => value !== undefined);
  if (expert.length !== fixture.expert.length) {
    throw new Error(`expert-paths: ${fixture.scenarioId} has a non-action expert step`);
  }
  entries.push({
    scenarioId: fixture.scenarioId,
    seed: fixture.seed,
    ticks: fixture.ticks ?? 0,
    expert,
    recorded: sampleExpertVitals(scenario, fixture.seed, expert),
  });
}

const lines = [
  '/**',
  ' * GENERATED FILE. Do not edit.',
  ' *',
  " * Written by `npm run expert-paths` from every closed-loop lesson's fixtures.",
  ' * Editing it directly is the mistake; `tests/unit/expert-paths.test.ts` is',
  ' * what catches both that and a stale copy.',
  ' */',
  "import type { ExpertPath } from './expert-trace';",
  '',
  'export const EXPERT_PATHS: readonly ExpertPath[] = [',
];
for (const entry of entries) {
  lines.push('  {');
  lines.push(`    scenarioId: ${JSON.stringify(entry.scenarioId)},`);
  lines.push(`    seed: ${entry.seed},`);
  lines.push(`    ticks: ${entry.ticks},`);
  lines.push('    expert: [');
  for (const value of entry.expert) lines.push(`      ${JSON.stringify(value)},`);
  lines.push('    ],');
  lines.push('    recorded: [');
  for (const sample of entry.recorded) {
    const vitals = Object.entries(sample.vitals).map(([key, value]) => `${key}: ${value}`).join(', ');
    lines.push(`      { tick: ${sample.tick}, vitals: { ${vitals} } },`);
  }
  lines.push('    ],');
  lines.push('  },');
}
lines.push('];', '');

writeFileSync(join(root, 'src/modules/anesthesia/debrief/expert-paths.generated.ts'), lines.join('\n'), 'utf8');
process.stdout.write(`expert-paths: wrote ${entries.length} closed-loop lessons\n`);
