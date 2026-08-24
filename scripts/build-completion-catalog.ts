import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import { buildAnesthesiaCompletionCatalog } from '@anesthesia/catalog/scenario-completion';
import { SCENARIO_COMPLETION_SCHEMA } from '@platform/catalog/scenario-completion';
import { buildScenarioQualityCatalog, QUALITY_SCHEMAS } from '@platform/catalog/scenario-quality';
import { buildMaturityCatalog, MATURITY_RECORD_SCHEMA } from '@platform/catalog/maturity';
import { additionalMaturitySubjects } from '@platform/governance/records';
import { ASSET_LICENSE_MANIFEST, buildEvidenceSourceManifest } from '@platform/catalog/provenance';
import { SOURCES } from '@platform/docs/sources';
import {
  buildPublicScenarioCatalog,
  SCENARIO_CATALOG_SCHEMA,
} from '@anesthesia/catalog/public-catalog';

const root = fileURLToPath(new URL('..', import.meta.url));
const target = join(root, 'public', 'catalog');
mkdirSync(target, { recursive: true });

const completion = buildAnesthesiaCompletionCatalog(SCENARIOS, ENGINE_VERSION);
const quality = buildScenarioQualityCatalog(completion);
writeFileSync(
  join(target, 'scenario-catalog.schema.json'),
  `${JSON.stringify(SCENARIO_CATALOG_SCHEMA, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(target, 'anesthesia-catalog.json'),
  `${JSON.stringify(buildPublicScenarioCatalog(SCENARIOS, completion), null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(target, 'scenario-completion.schema.json'),
  `${JSON.stringify(SCENARIO_COMPLETION_SCHEMA, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(target, 'anesthesia-completion-audit.json'),
  `${JSON.stringify(completion, null, 2)}\n`,
  'utf8',
);
for (const [name, recordSchema] of Object.entries(QUALITY_SCHEMAS)) {
  writeFileSync(join(target, `${name}.schema.json`), `${JSON.stringify(recordSchema, null, 2)}\n`, 'utf8');
}
writeFileSync(
  join(target, 'anesthesia-quality-audit.json'),
  `${JSON.stringify(quality, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(target, 'maturity-record.schema.json'),
  `${JSON.stringify(MATURITY_RECORD_SCHEMA, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(target, 'anesthesia-maturity.json'),
  `${JSON.stringify(buildMaturityCatalog(completion, quality, additionalMaturitySubjects()), null, 2)}\n`,
  'utf8',
);
writeFileSync(join(target, 'asset-licenses.json'), `${JSON.stringify(ASSET_LICENSE_MANIFEST, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'evidence-sources.json'), `${JSON.stringify(buildEvidenceSourceManifest(SOURCES), null, 2)}\n`, 'utf8');

process.stdout.write(`catalog: audited ${SCENARIOS.length} anesthesia scenarios\n`);
