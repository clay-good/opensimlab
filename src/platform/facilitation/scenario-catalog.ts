/**
 * Every scenario with the module route it lives under, for the facilitator
 * guide. Kept out of the landing and cockpit entries: only the lazily loaded
 * guide route and the prerender step import it.
 */
import { SCENARIOS } from '@anesthesia/scenarios';
import type { Scenario } from '@anesthesia/scenarios/types';
import { MODULES } from '@platform/modules/registry';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../../modules/emergency-medicine/scenarios';
import { CRITICAL_CARE_SCENARIOS } from '../../modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../../modules/cardiology/scenarios';
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../../modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../../modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../../modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../../modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../../modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../../modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../../modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../../modules/renal-electrolyte/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../../modules/infectious-disease/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../../modules/medical-surgical-nursing/scenarios';
import { ONCOLOGY_SCENARIOS } from '../../modules/oncology/scenarios';
import { SURGERY_TRAUMA_SCENARIOS } from '../../modules/surgery-trauma/scenarios';

const BY_ROUTE: Readonly<Record<string, readonly Scenario[]>> = {
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

export interface FacilitatedScenario {
  readonly moduleRoute: string;
  readonly moduleName: string;
  readonly scenario: Scenario;
}

/** Every available module's scenarios, in registry order. */
export const FACILITATED_SCENARIOS: readonly FacilitatedScenario[] = MODULES
  .filter((module) => module.status === 'available')
  .flatMap((module) => (BY_ROUTE[module.route] ?? []).map((scenario) => ({
    moduleRoute: module.route, moduleName: module.displayName, scenario,
  })));

export function facilitatorGuidePath(moduleRoute: string, scenarioId: string): string {
  return `/facilitator/${moduleRoute}/scenario/${scenarioId}`;
}

export function facilitatedScenarioFor(path: string): FacilitatedScenario | undefined {
  const match = /^\/facilitator\/([a-z-]+)\/scenario\/([^/]+)$/.exec(path);
  if (!match) return undefined;
  return FACILITATED_SCENARIOS.find((entry) => entry.moduleRoute === match[1]
    && entry.scenario.metadata.id === match[2]);
}
