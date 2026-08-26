import type { Scenario } from '@anesthesia/scenarios/types';
import { POSTPARTUM_HEMORRHAGE_UTERINE_ATONY } from './postpartum-hemorrhage-uterine-atony';
import { MATERNAL_SEPSIS_POSTPARTUM_DETERIORATION } from './maternal-sepsis-postpartum-deterioration';
import { CONCEALED_PLACENTAL_ABRUPTION_HEMORRHAGE } from './concealed-placental-abruption-hemorrhage';
import { POSTPARTUM_SEVERE_PREECLAMPSIA_WARNING_SIGNS } from './postpartum-severe-preeclampsia-warning-signs';
import { ECLAMPSIA_FIRST_SEIZURE_RESPONSE } from './eclampsia-first-seizure-response';
import { SUSPECTED_AMNIOTIC_FLUID_EMBOLISM_PATTERN } from './suspected-amniotic-fluid-embolism-pattern';

export const OBSTETRICS_SCENARIOS: readonly Scenario[] = [
  POSTPARTUM_HEMORRHAGE_UTERINE_ATONY,
  MATERNAL_SEPSIS_POSTPARTUM_DETERIORATION,
  CONCEALED_PLACENTAL_ABRUPTION_HEMORRHAGE,
  POSTPARTUM_SEVERE_PREECLAMPSIA_WARNING_SIGNS,
  ECLAMPSIA_FIRST_SEIZURE_RESPONSE,
  SUSPECTED_AMNIOTIC_FLUID_EMBOLISM_PATTERN,
];
export const DEFAULT_OBSTETRICS_SCENARIO_ID = POSTPARTUM_HEMORRHAGE_UTERINE_ATONY.metadata.id;

export function getObstetricsScenario(id: string): Scenario | undefined {
  return OBSTETRICS_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
