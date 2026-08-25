import type { Scenario } from '@anesthesia/scenarios/types';
import { ACUTE_PULMONARY_EDEMA_RESPIRATORY_SUPPORT_REASSESSMENT } from './acute-pulmonary-edema-respiratory-support-reassessment';
import { ACUTE_SEVERE_ASTHMA } from './acute-severe-asthma';
import { COPD_EXACERBATION_TRANSITION_REASSESSMENT } from './copd-exacerbation-transition-reassessment';
import { COMMUNITY_ACQUIRED_PNEUMONIA_HYPOXEMIA_REASSESSMENT } from './community-acquired-pneumonia-hypoxemia-reassessment';
import { POST_PULMONARY_EMBOLISM_PERSISTENT_DYSPNEA } from './post-pulmonary-embolism-persistent-dyspnea';
import { SPONTANEOUS_TENSION_PNEUMOTHORAX_POST_DRAINAGE_REASSESSMENT } from './spontaneous-tension-pneumothorax-post-drainage-reassessment';

export const RESPIRATORY_MEDICINE_SCENARIOS: readonly Scenario[] = [
  ACUTE_SEVERE_ASTHMA,
  COPD_EXACERBATION_TRANSITION_REASSESSMENT,
  COMMUNITY_ACQUIRED_PNEUMONIA_HYPOXEMIA_REASSESSMENT,
  POST_PULMONARY_EMBOLISM_PERSISTENT_DYSPNEA,
  ACUTE_PULMONARY_EDEMA_RESPIRATORY_SUPPORT_REASSESSMENT,
  SPONTANEOUS_TENSION_PNEUMOTHORAX_POST_DRAINAGE_REASSESSMENT,
];
export const DEFAULT_RESPIRATORY_MEDICINE_SCENARIO_ID = ACUTE_SEVERE_ASTHMA.metadata.id;

export function getRespiratoryMedicineScenario(id: string): Scenario | undefined {
  return RESPIRATORY_MEDICINE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
