import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsNstemiRisk, type NstemiRiskAction, type NstemiRiskProgress } from '../nstemi-risk';
import { nstemiRiskInlinePrompt } from '../tutor/nstemi-risk-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: NstemiRiskProgress): string {
  const prompt = nstemiRiskInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const NSTEMI_RISK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNstemiRiskDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNstemiRisk(scenario);
}

export interface NstemiRiskDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NstemiRiskAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient who is comfortable right now.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It examines nobody, acquires and interprets no test, calculates
 * no score, diagnoses nothing, prescribes and delivers no treatment, chooses no
 * procedure, determines no universal timing or disposition, and predicts no
 * prognosis or outcome.
 */
export function nstemiRiskDemonstrationStep(
  patient?: NstemiRiskProgress,
): NstemiRiskDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is still pain-free, which is the same sentence as an hour ago and not the same fact. What the next team inherits is two troponins, two ECGs, a screen done just now rather than on arrival, and a list of what would change the plan. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.12, action: 'reconcile-nstemi-serial-trajectory',
      narration: narrate(patient) };
  }
  if (patient.verificationAtTick === null) {
    return { id: 'verification', focus: 'monitor', progress: 0.34, action: 'verify-nstemi-and-alternatives',
      narration: narrate(patient) };
  }
  if (patient.veryHighRiskAtTick === null) {
    return { id: 'veryHighRisk', focus: 'monitor', progress: 0.56, action: 'screen-nstemi-very-high-risk-features',
      narration: narrate(patient) };
  }
  if (patient.strategyAtTick === null) {
    return { id: 'strategy', focus: 'actions', progress: 0.78, action: 'record-nstemi-invasive-strategy',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'record-nstemi-monitoring-and-handoff',
    narration: narrate(patient) };
}
