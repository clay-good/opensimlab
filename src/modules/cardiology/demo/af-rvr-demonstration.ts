import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsAfRvr, type AfRvrAction, type AfRvrProgress } from '../af-rvr';
import { afRvrInlinePrompt } from '../tutor/af-rvr-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: AfRvrProgress): string {
  const prompt = afRvrInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const AF_RVR_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAfRvrDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAfRvr(scenario);
}

export interface AfRvrDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AfRvrAction; readonly finished?: boolean;
}

/**
 * The worked example for a rate that pulls harder than it should.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It acquires and interprets no ECG or test, calculates no score,
 * diagnoses nothing, prescribes and delivers no medication, selects no rate or
 * rhythm agent, performs no cardioversion, determines no disposition, and
 * predicts no outcome.
 */
export function afRvrDemonstrationStep(patient?: AfRvrProgress): AfRvrDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Her rate is lower and her atrium is unchanged. Nobody chose a drug, nobody scored her, and the two questions that will actually decide her year — how long this had been going on, and what protects her from a stroke — are written down as open rather than answered. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.12, action: 'reconcile-af-rvr-rhythm-and-stability',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.34, action: 'review-af-rvr-context-and-triggers',
      narration: narrate(patient) };
  }
  if (patient.rateIntentAtTick === null) {
    return { id: 'rate', focus: 'actions', progress: 0.56, action: 'record-af-rvr-rate-control-intent',
      narration: narrate(patient) };
  }
  if (patient.strokePreventionAtTick === null) {
    return { id: 'stroke', focus: 'actions', progress: 0.78, action: 'record-af-rvr-stroke-prevention-intent',
      narration: narrate(patient) };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.92, action: 'reassess-af-rvr-trajectory-and-follow-up',
    narration: narrate(patient) };
}
