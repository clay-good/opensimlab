import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import {
  buildAnesthesiaCompletionCatalog,
  buildModuleCompletionCatalog,
} from '@anesthesia/catalog/scenario-completion';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../src/modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../src/modules/cardiology/scenarios';
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
const emergencyCompletion = buildModuleCompletionCatalog(
  EMERGENCY_MEDICINE_SCENARIOS,
  ENGINE_VERSION,
  'emergency-medicine',
  'emergency-department',
  'state_transition',
);
const emergencyQuality = buildScenarioQualityCatalog(emergencyCompletion);
const criticalCareCompletion = buildModuleCompletionCatalog(
  CRITICAL_CARE_SCENARIOS, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition',
);
const criticalCareQuality = buildScenarioQualityCatalog(criticalCareCompletion);
const cardiologyCompletion = buildModuleCompletionCatalog(
  CARDIOLOGY_SCENARIOS, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition',
);
const cardiologyQuality = buildScenarioQualityCatalog(cardiologyCompletion);
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
  join(target, 'emergency-medicine-completion-audit.json'),
  `${JSON.stringify(emergencyCompletion, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(target, 'emergency-medicine-quality-audit.json'),
  `${JSON.stringify(emergencyQuality, null, 2)}\n`,
  'utf8',
);
writeFileSync(join(target, 'critical-care-completion-audit.json'),
  `${JSON.stringify(criticalCareCompletion, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'critical-care-quality-audit.json'),
  `${JSON.stringify(criticalCareQuality, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'cardiology-completion-audit.json'),
  `${JSON.stringify(cardiologyCompletion, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'cardiology-quality-audit.json'),
  `${JSON.stringify(cardiologyQuality, null, 2)}\n`, 'utf8');
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
writeFileSync(
  join(target, 'emergency-medicine-maturity.json'),
  `${JSON.stringify(buildMaturityCatalog(emergencyCompletion, emergencyQuality), null, 2)}\n`,
  'utf8',
);
writeFileSync(join(target, 'critical-care-maturity.json'),
  `${JSON.stringify(buildMaturityCatalog(criticalCareCompletion, criticalCareQuality), null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'cardiology-maturity.json'),
  `${JSON.stringify(buildMaturityCatalog(cardiologyCompletion, cardiologyQuality), null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'asset-licenses.json'), `${JSON.stringify(ASSET_LICENSE_MANIFEST, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'evidence-sources.json'), `${JSON.stringify(buildEvidenceSourceManifest(SOURCES), null, 2)}\n`, 'utf8');

process.stdout.write(
  `catalog: audited ${SCENARIOS.length} anesthesia, ${EMERGENCY_MEDICINE_SCENARIOS.length} emergency medicine, ${CRITICAL_CARE_SCENARIOS.length} critical care, and ${CARDIOLOGY_SCENARIOS.length} cardiology scenarios\n`,
);
