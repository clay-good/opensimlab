import type { Scenario } from '@anesthesia/scenarios/types';
import { UNDIFFERENTIATED_SHOCK } from './undifferentiated-shock';
import { SEPTIC_SHOCK } from './septic-shock';
import { HEMORRHAGIC_SHOCK } from './hemorrhagic-shock';
import { OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX } from './obstructive-shock-tension-pneumothorax';
import { CARDIAC_TAMPONADE } from './cardiac-tamponade';
import { ANAPHYLAXIS } from './anaphylaxis';
import { ADULT_ASTHMA } from './adult-asthma';
import { COPD_EXACERBATION } from './copd-exacerbation';
import { ACUTE_PULMONARY_EDEMA } from './acute-pulmonary-edema';
import { PULMONARY_EMBOLISM_DETERIORATION } from './pulmonary-embolism-deterioration';
import { STEMI } from './stemi';

export const EMERGENCY_MEDICINE_SCENARIOS: readonly Scenario[] = [
  UNDIFFERENTIATED_SHOCK,
  SEPTIC_SHOCK,
  HEMORRHAGIC_SHOCK,
  OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX,
  CARDIAC_TAMPONADE,
  ANAPHYLAXIS,
  ADULT_ASTHMA,
  COPD_EXACERBATION,
  ACUTE_PULMONARY_EDEMA,
  PULMONARY_EMBOLISM_DETERIORATION,
  STEMI,
];
export const DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID = UNDIFFERENTIATED_SHOCK.metadata.id;

export function getEmergencyMedicineScenario(id: string): Scenario | undefined {
  return EMERGENCY_MEDICINE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
