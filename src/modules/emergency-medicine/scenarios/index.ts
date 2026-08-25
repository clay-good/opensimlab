import type { Scenario } from '@anesthesia/scenarios/types';
import { UNDIFFERENTIATED_SHOCK } from './undifferentiated-shock';
import { SEPTIC_SHOCK } from './septic-shock';
import { HEMORRHAGIC_SHOCK } from './hemorrhagic-shock';
import { OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX } from './obstructive-shock-tension-pneumothorax';
import { CARDIAC_TAMPONADE } from './cardiac-tamponade';

export const EMERGENCY_MEDICINE_SCENARIOS: readonly Scenario[] = [
  UNDIFFERENTIATED_SHOCK,
  SEPTIC_SHOCK,
  HEMORRHAGIC_SHOCK,
  OBSTRUCTIVE_SHOCK_TENSION_PNEUMOTHORAX,
  CARDIAC_TAMPONADE,
];
export const DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID = UNDIFFERENTIATED_SHOCK.metadata.id;

export function getEmergencyMedicineScenario(id: string): Scenario | undefined {
  return EMERGENCY_MEDICINE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
