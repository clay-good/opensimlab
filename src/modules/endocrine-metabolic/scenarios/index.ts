import type { Scenario } from '@anesthesia/scenarios/types';
import { DKA_RESOLUTION_TRANSITION } from './dka-resolution-transition';

export const ENDOCRINE_METABOLIC_SCENARIOS: readonly Scenario[] = [DKA_RESOLUTION_TRANSITION];
export const DEFAULT_ENDOCRINE_METABOLIC_SCENARIO_ID = DKA_RESOLUTION_TRANSITION.metadata.id;

export function getEndocrineMetabolicScenario(id: string): Scenario | undefined {
  return ENDOCRINE_METABOLIC_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
