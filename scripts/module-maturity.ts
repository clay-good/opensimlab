/**
 * One maturity catalog per module, built the same way for every consumer.
 *
 * The published file and the copy the adoption pack reads used to be assembled
 * by two separate calls, and only the first passed anesthesia its extra
 * subjects. The test that holds the published files against a fresh build used
 * a third. They all come through here now, so a subject cannot reach one and
 * miss another.
 */
import { buildMaturityCatalog } from '@platform/catalog/maturity';
import type { MaturityCatalog } from '@platform/catalog/maturity';
import type { ScenarioCompletionCatalog } from '@platform/catalog/scenario-completion';
import type { ScenarioQualityCatalog } from '@platform/catalog/scenario-quality';
import { additionalMaturitySubjects } from '@platform/governance/records';
import { rapidCycleMaturitySubjects } from '@anesthesia/catalog/rapid-cycle';
import type { Scenario } from '@anesthesia/scenarios/types';
import { SCENARIOS } from '@anesthesia/scenarios';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../src/modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../src/modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../src/modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../src/modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../src/modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../src/modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../src/modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../src/modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../src/modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../src/modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../src/modules/renal-electrolyte/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../src/modules/infectious-disease/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../src/modules/medical-surgical-nursing/scenarios';
import { ONCOLOGY_SCENARIOS } from '../src/modules/oncology/scenarios';
import { SURGERY_TRAUMA_SCENARIOS } from '../src/modules/surgery-trauma/scenarios';

/** Every module's scenarios, so a maturity catalog can read its own authored tutor rules. */
const SCENARIOS_BY_MODULE: Readonly<Record<string, readonly Scenario[]>> = {
  anesthesia: SCENARIOS,
  'emergency-medicine': EMERGENCY_MEDICINE_SCENARIOS,
  'critical-care': CRITICAL_CARE_SCENARIOS,
  cardiology: CARDIOLOGY_SCENARIOS,
  'respiratory-medicine': RESPIRATORY_MEDICINE_SCENARIOS,
  pediatrics: PEDIATRICS_SCENARIOS,
  neurology: NEUROLOGY_SCENARIOS,
  toxicology: TOXICOLOGY_SCENARIOS,
  obstetrics: OBSTETRICS_SCENARIOS,
  neonatology: NEONATOLOGY_SCENARIOS,
  'endocrine-metabolic': ENDOCRINE_METABOLIC_SCENARIOS,
  'renal-electrolyte': RENAL_ELECTROLYTE_SCENARIOS,
  'infectious-disease': INFECTIOUS_DISEASE_SCENARIOS,
  'medical-surgical-nursing': MEDICAL_SURGICAL_NURSING_SCENARIOS,
  oncology: ONCOLOGY_SCENARIOS,
  'surgery-trauma': SURGERY_TRAUMA_SCENARIOS,
};

/** Every module's scenarios in one list, for the consumers that judge their content. */
export const RAPID_CYCLE_SCENARIOS: readonly Scenario[] =
  Object.values(SCENARIOS_BY_MODULE).flatMap((scenarios) => [...scenarios]);

/**
 * One maturity catalog per module, built the same way everywhere.
 *
 * The published file and the copy the adoption pack reads used to be built by
 * two separate calls, and only the first passed anesthesia its extra subjects.
 * They go through here now, so a subject cannot reach one and miss the other.
 */
export function moduleMaturity(
  completion: ScenarioCompletionCatalog,
  quality: ScenarioQualityCatalog,
): MaturityCatalog {
  return buildMaturityCatalog(completion, quality, [
    ...completion.moduleId === 'anesthesia' ? additionalMaturitySubjects() : [],
    ...rapidCycleMaturitySubjects(SCENARIOS_BY_MODULE[completion.moduleId] ?? [], completion.moduleId),
  ]);
}
