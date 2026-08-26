import type { Scenario } from '@anesthesia/scenarios/types';
import { CARBON_MONOXIDE_REASSURING_MONITOR } from './carbon-monoxide-reassuring-monitor';
import { METHEMOGLOBINEMIA_SATURATION_GAP } from './methemoglobinemia-saturation-gap';

export const TOXICOLOGY_SCENARIOS: readonly Scenario[] = [
  METHEMOGLOBINEMIA_SATURATION_GAP,
  CARBON_MONOXIDE_REASSURING_MONITOR,
];
export const DEFAULT_TOXICOLOGY_SCENARIO_ID = METHEMOGLOBINEMIA_SATURATION_GAP.metadata.id;

export function getToxicologyScenario(id: string): Scenario | undefined {
  return TOXICOLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
