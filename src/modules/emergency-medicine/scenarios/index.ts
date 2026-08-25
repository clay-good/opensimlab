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
import { UNSTABLE_NARROW_COMPLEX_TACHYCARDIA } from './unstable-narrow-complex-tachycardia';
import { UNSTABLE_BRADYCARDIA } from './unstable-bradycardia';
import { PERSISTENT_VF_ARREST } from './persistent-vf-arrest';
import { PEA_ARREST } from './pea-arrest';
import { STATUS_EPILEPTICUS } from './status-epilepticus';
import { ACUTE_ISCHEMIC_STROKE } from './acute-ischemic-stroke';
import { INTRACRANIAL_HEMORRHAGE_DETERIORATION } from './intracranial-hemorrhage-deterioration';
import { DIABETIC_KETOACIDOSIS } from './diabetic-ketoacidosis';
import { HYPERKALEMIA_WITH_ECG_CHANGE } from './hyperkalemia-with-ecg-change';
import { SEVERE_HYPONATREMIA_WITH_SEIZURE } from './severe-hyponatremia-with-seizure';
import { OPIOID_TOXICITY } from './opioid-toxicity';
import { EXERTIONAL_HEAT_STROKE } from './exertional-heat-stroke';
import { TRAUMA_PRIMARY_SURVEY } from './trauma-primary-survey';
import { ACUTE_AORTIC_SYNDROME } from './acute-aortic-syndrome';

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
  UNSTABLE_NARROW_COMPLEX_TACHYCARDIA,
  UNSTABLE_BRADYCARDIA,
  PERSISTENT_VF_ARREST,
  PEA_ARREST,
  STATUS_EPILEPTICUS,
  ACUTE_ISCHEMIC_STROKE,
  INTRACRANIAL_HEMORRHAGE_DETERIORATION,
  DIABETIC_KETOACIDOSIS,
  HYPERKALEMIA_WITH_ECG_CHANGE,
  SEVERE_HYPONATREMIA_WITH_SEIZURE,
  OPIOID_TOXICITY,
  EXERTIONAL_HEAT_STROKE,
  TRAUMA_PRIMARY_SURVEY,
  ACUTE_AORTIC_SYNDROME,
];
export const DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID = UNDIFFERENTIATED_SHOCK.metadata.id;

export function getEmergencyMedicineScenario(id: string): Scenario | undefined {
  return EMERGENCY_MEDICINE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
