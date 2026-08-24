import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import { buildAnesthesiaCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { SCENARIO_COMPLETION_SCHEMA } from '@platform/catalog/scenario-completion';

const root = fileURLToPath(new URL('..', import.meta.url));
const target = join(root, 'public', 'catalog');
mkdirSync(target, { recursive: true });

writeFileSync(
  join(target, 'scenario-completion.schema.json'),
  `${JSON.stringify(SCENARIO_COMPLETION_SCHEMA, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(target, 'anesthesia-completion-audit.json'),
  `${JSON.stringify(buildAnesthesiaCompletionCatalog(SCENARIOS, ENGINE_VERSION), null, 2)}\n`,
  'utf8',
);

process.stdout.write(`catalog: audited ${SCENARIOS.length} anesthesia scenarios\n`);
