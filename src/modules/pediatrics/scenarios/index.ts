import type { Scenario } from '@anesthesia/scenarios/types';
import { PEDIATRIC_RESPIRATORY_DISTRESS } from './pediatric-respiratory-distress';

export const PEDIATRICS_SCENARIOS: readonly Scenario[] = [PEDIATRIC_RESPIRATORY_DISTRESS];
export const DEFAULT_PEDIATRICS_SCENARIO_ID = PEDIATRIC_RESPIRATORY_DISTRESS.metadata.id;

export function getPediatricsScenario(id: string): Scenario | undefined {
  return PEDIATRICS_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
