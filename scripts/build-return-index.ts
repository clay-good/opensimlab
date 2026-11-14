/**
 * Writes `src/platform/catalog/return-index.generated.ts`.
 *
 * Run with `npm run return-index` after editing any scenario's title, duration
 * or objective statements. `tests/unit/return-index.test.ts` fails when the
 * committed file no longer matches the catalogues, which makes forgetting to
 * run it a caught mistake rather than a suggestion naming a lesson by its old
 * words.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildReturnIndex } from '@platform/catalog/return-index';
import { RETURN_INDEX_INPUT } from './return-index-input';

const entries = buildReturnIndex(RETURN_INDEX_INPUT);

const lines = [
  '/**',
  ' * GENERATED FILE. Do not edit.',
  ' *',
  " * Written by `npm run return-index` from every available module's scenarios.",
  ' * Editing it directly is the mistake; `tests/unit/return-index.test.ts` is',
  ' * what catches both that and a stale copy.',
  ' */',
  "import type { ReturnIndexEntry } from './return-index';",
  '',
  'export const RETURN_INDEX: readonly ReturnIndexEntry[] = [',
];
for (const entry of entries) {
  lines.push('  {');
  lines.push(`    moduleId: ${JSON.stringify(entry.moduleId)},`);
  lines.push(`    scenarioId: ${JSON.stringify(entry.scenarioId)},`);
  lines.push(`    title: ${JSON.stringify(entry.title)},`);
  lines.push(`    estimatedMinutes: ${entry.estimatedMinutes},`);
  lines.push('    objectives: [');
  for (const objective of entry.objectives) {
    lines.push(`      { id: ${JSON.stringify(objective.id)}, statement: ${JSON.stringify(objective.statement)} },`);
  }
  lines.push('    ],');
  lines.push('  },');
}
lines.push('];', '');

writeFileSync(
  fileURLToPath(new URL('../src/platform/catalog/return-index.generated.ts', import.meta.url)),
  lines.join('\n'),
  'utf8',
);
process.stdout.write(`return-index: wrote ${entries.length} scenarios\n`);
