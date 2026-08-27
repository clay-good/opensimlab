import type { Scenario } from '@anesthesia/scenarios/types';
import { DKA_RESOLUTION_TRANSITION } from './dka-resolution-transition';
import { HHS_OSMOLALITY_TRAJECTORY } from './hhs-osmolality-trajectory';
import { SEVERE_HYPOGLYCEMIA_RECURRENCE } from './severe-hypoglycemia-recurrence';
import { ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS } from './adrenal-crisis-treatment-before-tests';
import { THYROID_STORM_HEMODYNAMIC_RISK } from './thyroid-storm-hemodynamic-risk';
import { MYXEDEMA_COMA_VENTILATION_AND_STEROID_SEQUENCE } from './myxedema-coma-ventilation-and-steroid-sequence';

export const ENDOCRINE_METABOLIC_SCENARIOS: readonly Scenario[] = [DKA_RESOLUTION_TRANSITION, HHS_OSMOLALITY_TRAJECTORY, SEVERE_HYPOGLYCEMIA_RECURRENCE, ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS, THYROID_STORM_HEMODYNAMIC_RISK, MYXEDEMA_COMA_VENTILATION_AND_STEROID_SEQUENCE];
export const DEFAULT_ENDOCRINE_METABOLIC_SCENARIO_ID = DKA_RESOLUTION_TRANSITION.metadata.id;

export function getEndocrineMetabolicScenario(id: string): Scenario | undefined {
  return ENDOCRINE_METABOLIC_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
