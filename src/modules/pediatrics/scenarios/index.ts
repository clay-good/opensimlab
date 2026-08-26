import type { Scenario } from '@anesthesia/scenarios/types';
import { BRONCHIOLITIS } from './bronchiolitis';
import { CROUP } from './croup';
import { PEDIATRIC_RESPIRATORY_DISTRESS } from './pediatric-respiratory-distress';
import { PEDIATRIC_SEPSIS } from './pediatric-sepsis';
import { PEDIATRIC_STATUS_ASTHMATICUS } from './pediatric-status-asthmaticus';

export const PEDIATRICS_SCENARIOS: readonly Scenario[] = [
  PEDIATRIC_RESPIRATORY_DISTRESS,
  BRONCHIOLITIS,
  CROUP,
  PEDIATRIC_STATUS_ASTHMATICUS,
  PEDIATRIC_SEPSIS,
];
export const DEFAULT_PEDIATRICS_SCENARIO_ID = PEDIATRIC_RESPIRATORY_DISTRESS.metadata.id;

export function getPediatricsScenario(id: string): Scenario | undefined {
  return PEDIATRICS_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
