import type { Scenario } from '@anesthesia/scenarios/types';
import { RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND } from './hyperkalemia-cardioprotection-and-rebound';
import { RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES } from './hypokalemia-magnesium-and-ongoing-losses';
import { RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT } from './hyponatremia-symptoms-and-reassessment';
import { RENAL_HYPERNATREMIA_WATER_ACCESS_AND_LOSSES } from './hypernatremia-water-access-and-losses';
import { RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD } from './hypocalcemia-ionized-calcium-and-ckd';
import { RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL } from './hypermagnesemia-antagonism-and-removal';
import { RENAL_HYPOMAGNESEMIA_REFRACTORY_POTASSIUM } from './hypomagnesemia-refractory-potassium-and-the-normal-number';
import { RENAL_CONTRAST_ATTRIBUTION_LABEL } from './contrast-attribution-a-label-that-stopped-the-search';
import { RENAL_RHABDOMYOLYSIS_NUMBER } from './rhabdomyolysis-a-number-that-does-not-carry-the-risk';

export const RENAL_ELECTROLYTE_SCENARIOS: readonly Scenario[] = [RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND, RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES, RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT, RENAL_HYPERNATREMIA_WATER_ACCESS_AND_LOSSES, RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD, RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL, RENAL_HYPOMAGNESEMIA_REFRACTORY_POTASSIUM, RENAL_CONTRAST_ATTRIBUTION_LABEL, RENAL_RHABDOMYOLYSIS_NUMBER];
export const DEFAULT_RENAL_ELECTROLYTE_SCENARIO_ID = RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND.metadata.id;

export function getRenalElectrolyteScenario(id: string): Scenario | undefined {
  return RENAL_ELECTROLYTE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
