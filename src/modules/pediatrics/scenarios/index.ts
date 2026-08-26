import type { Scenario } from '@anesthesia/scenarios/types';
import { BRONCHIOLITIS } from './bronchiolitis';
import { CROUP } from './croup';
import { PEDIATRIC_RESPIRATORY_DISTRESS } from './pediatric-respiratory-distress';
import { PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA } from './pediatric-dehydration-with-hypovolemia';
import { PEDIATRIC_DIABETIC_KETOACIDOSIS } from './pediatric-diabetic-ketoacidosis';
import { PEDIATRIC_HYPOGLYCEMIC_SEIZURE } from './pediatric-hypoglycemic-seizure';
import { PEDIATRIC_SEPSIS } from './pediatric-sepsis';
import { PEDIATRIC_SEPTIC_SHOCK } from './pediatric-septic-shock';
import { PEDIATRIC_STATUS_ASTHMATICUS } from './pediatric-status-asthmaticus';

export const PEDIATRICS_SCENARIOS: readonly Scenario[] = [
  PEDIATRIC_RESPIRATORY_DISTRESS,
  BRONCHIOLITIS,
  CROUP,
  PEDIATRIC_STATUS_ASTHMATICUS,
  PEDIATRIC_SEPSIS,
  PEDIATRIC_SEPTIC_SHOCK,
  PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA,
  PEDIATRIC_DIABETIC_KETOACIDOSIS,
  PEDIATRIC_HYPOGLYCEMIC_SEIZURE,
];
export const DEFAULT_PEDIATRICS_SCENARIO_ID = PEDIATRIC_RESPIRATORY_DISTRESS.metadata.id;

export function getPediatricsScenario(id: string): Scenario | undefined {
  return PEDIATRICS_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
