import type { Scenario } from '@anesthesia/scenarios/types';
import { ARDS_LUNG_PROTECTIVE_VENTILATION } from './ards-lung-protective-ventilation';
import { ESCALATING_HYPOXEMIA } from './escalating-hypoxemia';
import { VENTILATOR_DYSSYNCHRONY } from './ventilator-dyssynchrony';

export const CRITICAL_CARE_SCENARIOS: readonly Scenario[] = [
  ARDS_LUNG_PROTECTIVE_VENTILATION,
  ESCALATING_HYPOXEMIA,
  VENTILATOR_DYSSYNCHRONY,
];
export const DEFAULT_CRITICAL_CARE_SCENARIO_ID = ARDS_LUNG_PROTECTIVE_VENTILATION.metadata.id;

export function getCriticalCareScenario(id: string): Scenario | undefined {
  return CRITICAL_CARE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
