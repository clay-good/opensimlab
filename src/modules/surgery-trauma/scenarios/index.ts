import type { Scenario } from '@anesthesia/scenarios/types';
import { NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO } from './negative-scan-a-scan-that-cannot-say-no';

export const SURGERY_TRAUMA_SCENARIOS: readonly Scenario[] = [NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO];
export const DEFAULT_SURGERY_TRAUMA_SCENARIO_ID = NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO.metadata.id;

export function getSurgeryTraumaScenario(id: string): Scenario | undefined {
  return SURGERY_TRAUMA_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
