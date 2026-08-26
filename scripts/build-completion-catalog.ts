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
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../src/modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../src/modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../src/modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../src/modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../src/modules/obstetrics/scenarios';
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
const reportTarget = join(root, 'workers', 'reports', 'src');
mkdirSync(target, { recursive: true });
mkdirSync(reportTarget, { recursive: true });

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
  CARDIOLOGY_SCENARIOS, ENGINE_VERSION, 'cardiology',
  (scenario) => scenario.metadata.id === 'post-infarction-cardiogenic-shock-escalation'
    ? 'icu' : 'clinic',
  'state_transition',
);
const cardiologyQuality = buildScenarioQualityCatalog(cardiologyCompletion);
const respiratoryMedicineCompletion = buildModuleCompletionCatalog(
  RESPIRATORY_MEDICINE_SCENARIOS, ENGINE_VERSION, 'respiratory-medicine',
  'icu', 'state_transition',
);
const respiratoryMedicineQuality = buildScenarioQualityCatalog(respiratoryMedicineCompletion);
const pediatricsCompletion = buildModuleCompletionCatalog(
  PEDIATRICS_SCENARIOS, ENGINE_VERSION, 'pediatrics', 'emergency-department', 'state_transition',
);
const pediatricsQuality = buildScenarioQualityCatalog(pediatricsCompletion);
const neurologyCompletion = buildModuleCompletionCatalog(
  NEUROLOGY_SCENARIOS, ENGINE_VERSION, 'neurology', 'ward', 'state_transition',
);
const neurologyQuality = buildScenarioQualityCatalog(neurologyCompletion);
const toxicologyCompletion = buildModuleCompletionCatalog(
  TOXICOLOGY_SCENARIOS, ENGINE_VERSION, 'toxicology', 'emergency-department', 'state_transition',
);
const toxicologyQuality = buildScenarioQualityCatalog(toxicologyCompletion);
const obstetricsCompletion = buildModuleCompletionCatalog(
  OBSTETRICS_SCENARIOS, ENGINE_VERSION, 'obstetrics', 'delivery-room', 'state_transition',
);
const obstetricsQuality = buildScenarioQualityCatalog(obstetricsCompletion);
const reportCatalog = {
  schemaVersion: 1,
  scenarios: [completion, emergencyCompletion, criticalCareCompletion, cardiologyCompletion,
    respiratoryMedicineCompletion, pediatricsCompletion, neurologyCompletion, toxicologyCompletion,
    obstetricsCompletion]
    .flatMap((catalog) => catalog.scenarios)
    .map((scenario) => ({
      scenarioId: scenario.scenarioId,
      contentVersion: scenario.contentVersion,
      moduleId: scenario.moduleId,
      maturity: scenario.maturity,
      practiceRegions: scenario.practiceRegions,
      fidelityClass: scenario.fidelityClass,
    })),
};
writeFileSync(
  join(reportTarget, 'report-catalog.generated.json'),
  `${JSON.stringify(reportCatalog, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(target, 'scenario-report-catalog.json'),
  `${JSON.stringify(reportCatalog, null, 2)}\n`,
  'utf8',
);
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
writeFileSync(join(target, 'respiratory-medicine-completion-audit.json'),
  `${JSON.stringify(respiratoryMedicineCompletion, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'respiratory-medicine-quality-audit.json'),
  `${JSON.stringify(respiratoryMedicineQuality, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'pediatrics-completion-audit.json'),
  `${JSON.stringify(pediatricsCompletion, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'pediatrics-quality-audit.json'),
  `${JSON.stringify(pediatricsQuality, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'neurology-completion-audit.json'),
  `${JSON.stringify(neurologyCompletion, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'neurology-quality-audit.json'),
  `${JSON.stringify(neurologyQuality, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'toxicology-completion-audit.json'),
  `${JSON.stringify(toxicologyCompletion, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'toxicology-quality-audit.json'),
  `${JSON.stringify(toxicologyQuality, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'obstetrics-completion-audit.json'),
  `${JSON.stringify(obstetricsCompletion, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'obstetrics-quality-audit.json'),
  `${JSON.stringify(obstetricsQuality, null, 2)}\n`, 'utf8');
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
writeFileSync(join(target, 'respiratory-medicine-maturity.json'),
  `${JSON.stringify(buildMaturityCatalog(respiratoryMedicineCompletion, respiratoryMedicineQuality), null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'pediatrics-maturity.json'),
  `${JSON.stringify(buildMaturityCatalog(pediatricsCompletion, pediatricsQuality), null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'neurology-maturity.json'),
  `${JSON.stringify(buildMaturityCatalog(neurologyCompletion, neurologyQuality), null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'toxicology-maturity.json'),
  `${JSON.stringify(buildMaturityCatalog(toxicologyCompletion, toxicologyQuality), null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'obstetrics-maturity.json'),
  `${JSON.stringify(buildMaturityCatalog(obstetricsCompletion, obstetricsQuality), null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'asset-licenses.json'), `${JSON.stringify(ASSET_LICENSE_MANIFEST, null, 2)}\n`, 'utf8');
writeFileSync(join(target, 'evidence-sources.json'), `${JSON.stringify(buildEvidenceSourceManifest(SOURCES), null, 2)}\n`, 'utf8');

process.stdout.write(
  `catalog: audited ${SCENARIOS.length} anesthesia, ${EMERGENCY_MEDICINE_SCENARIOS.length} emergency medicine, ${CRITICAL_CARE_SCENARIOS.length} critical care, ${CARDIOLOGY_SCENARIOS.length} cardiology, ${RESPIRATORY_MEDICINE_SCENARIOS.length} respiratory medicine, ${PEDIATRICS_SCENARIOS.length} pediatrics, ${NEUROLOGY_SCENARIOS.length} neurology, ${TOXICOLOGY_SCENARIOS.length} toxicology, and ${OBSTETRICS_SCENARIOS.length} obstetrics scenarios\n`,
);
