import type { Scenario } from '@anesthesia/scenarios/types';
import { UNDIFFERENTIATED_SHOCK } from './undifferentiated-shock';
import { SEPTIC_SHOCK } from './septic-shock';

export const EMERGENCY_MEDICINE_SCENARIOS: readonly Scenario[] = [
  UNDIFFERENTIATED_SHOCK,
  SEPTIC_SHOCK,
];
export const DEFAULT_EMERGENCY_MEDICINE_SCENARIO_ID = UNDIFFERENTIATED_SHOCK.metadata.id;

export function getEmergencyMedicineScenario(id: string): Scenario | undefined {
  return EMERGENCY_MEDICINE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
