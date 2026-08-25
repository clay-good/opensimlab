import type { Scenario } from '@anesthesia/scenarios/types';
import { ARDS_LUNG_PROTECTIVE_VENTILATION } from './ards-lung-protective-ventilation';
import { ESCALATING_HYPOXEMIA } from './escalating-hypoxemia';
import { VENTILATOR_DYSSYNCHRONY } from './ventilator-dyssynchrony';
import { AUTO_PEEP } from './auto-peep';
import { MUCUS_PLUGGING } from './mucus-plugging';
import { UNPLANNED_EXTUBATION } from './unplanned-extubation';
import { SPONTANEOUS_BREATHING_TRIAL } from './spontaneous-breathing-trial';

export const CRITICAL_CARE_SCENARIOS: readonly Scenario[] = [
  ARDS_LUNG_PROTECTIVE_VENTILATION,
  ESCALATING_HYPOXEMIA,
  VENTILATOR_DYSSYNCHRONY,
  AUTO_PEEP,
  MUCUS_PLUGGING,
  UNPLANNED_EXTUBATION,
  SPONTANEOUS_BREATHING_TRIAL,
];
export const DEFAULT_CRITICAL_CARE_SCENARIO_ID = ARDS_LUNG_PROTECTIVE_VENTILATION.metadata.id;

export function getCriticalCareScenario(id: string): Scenario | undefined {
  return CRITICAL_CARE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
