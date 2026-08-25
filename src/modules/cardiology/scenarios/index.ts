import type { Scenario } from '@anesthesia/scenarios/types';
import { STABLE_CHEST_PAIN_EVALUATION } from './stable-chest-pain-evaluation';
import { NSTEMI_RISK_REASSESSMENT } from './nstemi-risk-reassessment';
import { ACUTE_DECOMPENSATED_HEART_FAILURE } from './acute-decompensated-heart-failure';
import { ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE } from './atrial-fibrillation-with-rapid-response';

export const CARDIOLOGY_SCENARIOS: readonly Scenario[] = [
  STABLE_CHEST_PAIN_EVALUATION,
  NSTEMI_RISK_REASSESSMENT,
  ACUTE_DECOMPENSATED_HEART_FAILURE,
  ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE,
];
export const DEFAULT_CARDIOLOGY_SCENARIO_ID = STABLE_CHEST_PAIN_EVALUATION.metadata.id;

export function getCardiologyScenario(id: string): Scenario | undefined {
  return CARDIOLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
