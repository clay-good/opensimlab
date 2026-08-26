import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION } from '@anesthesia/engine';
import { SCENARIOS } from '@anesthesia/scenarios';
import {
  buildAnesthesiaCompletionCatalog, buildModuleCompletionCatalog,
} from '@anesthesia/catalog/scenario-completion';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../src/modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../../src/modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../src/modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../../src/modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../../src/modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../src/modules/toxicology/scenarios';
import { buildScenarioQualityCatalog } from '@platform/catalog/scenario-quality';
import {
  buildMaturityCatalog, MATURITY_RECORD_SCHEMA, MATURITY_STATUSES,
  maturityFor, validateMaturityCatalog,
} from '@platform/catalog/maturity';
import { additionalMaturitySubjects, reviewableItems } from '@platform/governance/records';

const completion = buildAnesthesiaCompletionCatalog(SCENARIOS, ENGINE_VERSION);
const quality = buildScenarioQualityCatalog(completion);
const catalog = buildMaturityCatalog(completion, quality, additionalMaturitySubjects());
const emergencyCompletion = buildModuleCompletionCatalog(
  EMERGENCY_MEDICINE_SCENARIOS, ENGINE_VERSION, 'emergency-medicine',
  'emergency-department', 'state_transition',
);
const emergencyCatalog = buildMaturityCatalog(
  emergencyCompletion, buildScenarioQualityCatalog(emergencyCompletion),
);
const criticalCareCompletion = buildModuleCompletionCatalog(
  CRITICAL_CARE_SCENARIOS, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition',
);
const criticalCareCatalog = buildMaturityCatalog(
  criticalCareCompletion, buildScenarioQualityCatalog(criticalCareCompletion),
);
const cardiologyCompletion = buildModuleCompletionCatalog(
  CARDIOLOGY_SCENARIOS, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition',
);
const cardiologyCatalog = buildMaturityCatalog(
  cardiologyCompletion, buildScenarioQualityCatalog(cardiologyCompletion),
);
const respiratoryMedicineCompletion = buildModuleCompletionCatalog(
  RESPIRATORY_MEDICINE_SCENARIOS, ENGINE_VERSION, 'respiratory-medicine', 'icu',
  'state_transition',
);
const respiratoryMedicineCatalog = buildMaturityCatalog(
  respiratoryMedicineCompletion, buildScenarioQualityCatalog(respiratoryMedicineCompletion),
);
const pediatricsCompletion = buildModuleCompletionCatalog(
  PEDIATRICS_SCENARIOS, ENGINE_VERSION, 'pediatrics', 'emergency-department', 'state_transition',
);
const pediatricsCatalog = buildMaturityCatalog(
  pediatricsCompletion, buildScenarioQualityCatalog(pediatricsCompletion),
);
const neurologyCompletion = buildModuleCompletionCatalog(
  NEUROLOGY_SCENARIOS, ENGINE_VERSION, 'neurology', 'ward', 'state_transition',
);
const neurologyCatalog = buildMaturityCatalog(
  neurologyCompletion, buildScenarioQualityCatalog(neurologyCompletion),
);
const toxicologyCompletion = buildModuleCompletionCatalog(
  TOXICOLOGY_SCENARIOS, ENGINE_VERSION, 'toxicology', 'emergency-department', 'state_transition',
);
const toxicologyCatalog = buildMaturityCatalog(
  toxicologyCompletion, buildScenarioQualityCatalog(toxicologyCompletion),
);

describe('exact-version maturity records', () => {
  it('supports the complete public vocabulary and records every clinical item honestly', () => {
    expect(MATURITY_STATUSES).toEqual([
      'draft', 'preview', 'source_checked', 'clinically_reviewed',
      'institution_endorsed', 'withdrawn',
    ]);
    expect(validateMaturityCatalog(catalog)).toEqual([]);
    expect(catalog.recordCount + emergencyCatalog.recordCount + criticalCareCatalog.recordCount
      + cardiologyCatalog.recordCount + respiratoryMedicineCatalog.recordCount
      + pediatricsCatalog.recordCount + neurologyCatalog.recordCount + toxicologyCatalog.recordCount)
      .toBe(reviewableItems().length);
    expect(catalog.recordCount).toBe(54);
    expect(catalog.records.every((record) => record.status === 'draft')).toBe(true);
    expect(maturityFor(catalog, 'explanation', 'hysteresis-and-effect-site-lag', '0.1.0'))
      .toBeDefined();
    expect(maturityFor(catalog, 'drug-card', 'propofol', '0.1.0')).toBeDefined();
    expect(maturityFor(catalog, 'practice-region', 'US', '0.1.0')).toBeDefined();
    expect(maturityFor(
      emergencyCatalog, 'scenario', 'undifferentiated-shock', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'ards-lung-protective-ventilation', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'escalating-hypoxemia', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      cardiologyCatalog, 'scenario', 'stable-chest-pain-evaluation', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      pediatricsCatalog, 'scenario', 'pediatric-respiratory-distress', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      neurologyCatalog, 'scenario', 'minor-nondisabling-acute-ischemic-stroke', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      neurologyCatalog, 'scenario', 'basilar-artery-occlusion-escalation', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      toxicologyCatalog, 'scenario', 'methemoglobinemia-saturation-gap', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      toxicologyCatalog, 'scenario', 'carbon-monoxide-reassuring-monitor', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      toxicologyCatalog, 'scenario', 'acetaminophen-clock-and-nomogram', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      toxicologyCatalog, 'scenario', 'salicylate-falling-number', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      toxicologyCatalog, 'scenario', 'tricyclic-sodium-channel-cardiotoxicity', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'ventilator-dyssynchrony', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'auto-peep', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'mucus-plugging', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'unplanned-extubation', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'spontaneous-breathing-trial', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'post-intubation-hypotension', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'cardiogenic-shock', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'mixed-shock', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'right-ventricular-failure', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'massive-pulmonary-embolism', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'upper-gi-hemorrhage', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'status-epilepticus', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'targeted-temperature-management', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'intracranial-hypertension', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'acute-kidney-injury-with-fluid-overload', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'severe-acidemia', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'icu-handoff-with-hidden-deterioration', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'ventilator-circuit-disconnection', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'delayed-vasopressor-delivery', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'pulse-oximeter-motion-artifact', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'endotracheal-tube-migration-after-repositioning', '0.1.0',
    )?.status).toBe('draft');
    expect(maturityFor(
      criticalCareCatalog, 'scenario', 'septic-shock-resuscitation', '0.1.0',
    )?.status).toBe('draft');
  });

  it('never applies a record to a different content version', () => {
    const current = SCENARIOS[0]!;
    expect(maturityFor(
      catalog, 'scenario', current.metadata.id, current.metadata.version,
    )?.status).toBe('draft');
    expect(maturityFor(catalog, 'scenario', current.metadata.id, '99.0.0')).toBeUndefined();
    expect(() => buildMaturityCatalog(completion, {
      ...quality, scenarios: quality.scenarios.slice(1),
    }, additionalMaturitySubjects()))
      .toThrow(`No exact-version quality audit for ${current.metadata.id} ${current.metadata.version}.`);
  });

  it('rejects duplicate subjects, unknown statuses, and dishonest counts', () => {
    const hostile = structuredClone(catalog) as unknown as {
      recordCount: number;
      records: Array<{
        recordId: string; subjectKind: string; subjectId: string;
        contentVersion: string; status: string;
      }>;
    };
    hostile.recordCount += 1;
    hostile.records[1]!.recordId = hostile.records[0]!.recordId;
    hostile.records[1]!.subjectKind = hostile.records[0]!.subjectKind;
    hostile.records[1]!.subjectId = hostile.records[0]!.subjectId;
    hostile.records[1]!.contentVersion = hostile.records[0]!.contentVersion;
    hostile.records[1]!.status = 'approved';
    const errors = validateMaturityCatalog(hostile);
    expect(errors).toContain('/recordCount: does not match records length');
    expect(errors.some((error) => error.includes('duplicate'))).toBe(true);
    expect(errors).toContain('/records/1/status: unsupported value');
  });

  it('publishes the schema and generated exact-version records', () => {
    const publicCatalog = join(process.cwd(), 'public', 'catalog');
    expect(JSON.parse(readFileSync(join(publicCatalog, 'maturity-record.schema.json'), 'utf8')))
      .toEqual(MATURITY_RECORD_SCHEMA);
    expect(JSON.parse(readFileSync(join(publicCatalog, 'anesthesia-maturity.json'), 'utf8')))
      .toEqual(catalog);
    expect(JSON.parse(readFileSync(join(publicCatalog, 'emergency-medicine-maturity.json'), 'utf8')))
      .toEqual(emergencyCatalog);
    expect(JSON.parse(readFileSync(join(publicCatalog, 'critical-care-maturity.json'), 'utf8')))
      .toEqual(criticalCareCatalog);
    expect(JSON.parse(readFileSync(join(publicCatalog, 'cardiology-maturity.json'), 'utf8')))
      .toEqual(cardiologyCatalog);
    expect(JSON.parse(readFileSync(join(publicCatalog, 'toxicology-maturity.json'), 'utf8')))
      .toEqual(toxicologyCatalog);
  });
});
