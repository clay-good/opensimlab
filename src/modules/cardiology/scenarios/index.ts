import type { Scenario } from '@anesthesia/scenarios/types';
import { STABLE_CHEST_PAIN_EVALUATION } from './stable-chest-pain-evaluation';
import { NSTEMI_RISK_REASSESSMENT } from './nstemi-risk-reassessment';

export const CARDIOLOGY_SCENARIOS: readonly Scenario[] = [
  STABLE_CHEST_PAIN_EVALUATION,
  NSTEMI_RISK_REASSESSMENT,
];
export const DEFAULT_CARDIOLOGY_SCENARIO_ID = STABLE_CHEST_PAIN_EVALUATION.metadata.id;

export function getCardiologyScenario(id: string): Scenario | undefined {
  return CARDIOLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
