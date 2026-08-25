import type { Scenario } from '@anesthesia/scenarios/types';
import { STABLE_CHEST_PAIN_EVALUATION } from './stable-chest-pain-evaluation';
import { NSTEMI_RISK_REASSESSMENT } from './nstemi-risk-reassessment';
import { ACUTE_DECOMPENSATED_HEART_FAILURE } from './acute-decompensated-heart-failure';
import { ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE } from './atrial-fibrillation-with-rapid-response';
import { STEMI_RECOGNITION_AND_FIRST_ACTIONS } from './stemi-recognition-and-first-actions';
import { POST_INFARCTION_CARDIOGENIC_SHOCK_ESCALATION } from './post-infarction-cardiogenic-shock-escalation';
import { REGULAR_NARROW_COMPLEX_TACHYCARDIA } from './regular-narrow-complex-tachycardia';
import { WIDE_COMPLEX_TACHYCARDIA } from './wide-complex-tachycardia';
import { SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT } from './symptomatic-sinus-bradycardia-reassessment';
import { COMPLETE_HEART_BLOCK } from './complete-heart-block';
import { TORSADES_DE_POINTES } from './torsades-de-pointes';
import { HYPERKALEMIC_CONDUCTION_DISTURBANCE } from './hyperkalemic-conduction-disturbance';
import { PERICARDIAL_TAMPONADE } from './pericardial-tamponade';
import { RIGHT_VENTRICULAR_INFARCTION } from './right-ventricular-infarction';
import { HYPERTENSIVE_EMERGENCY } from './hypertensive-emergency';
import { PACEMAKER_CAPTURE_FAILURE } from './pacemaker-capture-failure';

export const CARDIOLOGY_SCENARIOS: readonly Scenario[] = [
  STABLE_CHEST_PAIN_EVALUATION,
  STEMI_RECOGNITION_AND_FIRST_ACTIONS,
  NSTEMI_RISK_REASSESSMENT,
  ACUTE_DECOMPENSATED_HEART_FAILURE,
  POST_INFARCTION_CARDIOGENIC_SHOCK_ESCALATION,
  ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE,
  REGULAR_NARROW_COMPLEX_TACHYCARDIA,
  WIDE_COMPLEX_TACHYCARDIA,
  SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT,
  COMPLETE_HEART_BLOCK,
  TORSADES_DE_POINTES,
  HYPERKALEMIC_CONDUCTION_DISTURBANCE,
  PERICARDIAL_TAMPONADE,
  RIGHT_VENTRICULAR_INFARCTION,
  HYPERTENSIVE_EMERGENCY,
  PACEMAKER_CAPTURE_FAILURE,
];
export const DEFAULT_CARDIOLOGY_SCENARIO_ID = STABLE_CHEST_PAIN_EVALUATION.metadata.id;

export function getCardiologyScenario(id: string): Scenario | undefined {
  return CARDIOLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
