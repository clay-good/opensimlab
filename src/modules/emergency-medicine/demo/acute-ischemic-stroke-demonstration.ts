import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAcuteIschemicStroke, type AcuteIschemicStrokeAction,
  type AcuteIschemicStrokeProgress,
} from '../acute-ischemic-stroke';
import { acuteIschemicStrokeInlinePrompt } from '../tutor/acute-ischemic-stroke-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: AcuteIschemicStrokeProgress): string {
  const prompt = acuteIschemicStrokeInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ACUTE_ISCHEMIC_STROKE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAcuteIschemicStrokeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAcuteIschemicStroke(scenario);
}

export interface AcuteIschemicStrokeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AcuteIschemicStrokeAction;
  readonly finished?: boolean;
}

/**
 * The worked example for two pathways that are not a sequence.
 *
 * Six beats in the only order the engine accepts. It examines nobody, scores no
 * severity, acquires and interprets no image, prepares and delivers no drug,
 * transfers nobody, performs no procedure, diagnoses nothing, determines no
 * disposition, and predicts no outcome.
 */
export function acuteIschemicStrokeDemonstrationStep(
  patient?: AcuteIschemicStrokeProgress,
): AcuteIschemicStrokeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessedAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The transfer was activated without waiting to see whether the drug worked, and that is the whole example. Thrombolysis reads like the treatment and thrombectomy like the fallback, which turns two parallel pathways into a queue — and a clot in an M1 is often too big for a drug to clear, so the queue costs exactly the time the last-known-well clock is counting. Nothing here was delivered or transferred, her deficits were not re-scored, and what leaves with her is a set of times rather than a claim. This ends the example, not the evaluation.' };
  }
  if (patient.presentationReviewedAtTick === null) {
    return { id: 'presentation', focus: 'monitor', progress: 0.1,
      action: 'review-stroke-presentation', narration: narrate(patient) };
  }
  if (patient.systemActivatedAtTick === null) {
    return { id: 'activate', focus: 'actions', progress: 0.27,
      action: 'activate-stroke-system', narration: narrate(patient) };
  }
  if (patient.imagingReviewedAtTick === null) {
    return { id: 'imaging', focus: 'monitor', progress: 0.45,
      action: 'review-stroke-imaging-and-eligibility', narration: narrate(patient) };
  }
  if (patient.tenecteplaseAtTick === null) {
    return { id: 'thrombolysis', focus: 'actions', progress: 0.62,
      action: 'record-tenecteplase-20-mg-intent', narration: narrate(patient) };
  }
  if (patient.thrombectomyActivatedAtTick === null) {
    return { id: 'thrombectomy', focus: 'actions', progress: 0.79,
      action: 'activate-thrombectomy-transfer', narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'monitor', progress: 0.92,
    action: 'reassess-and-handoff-stroke', narration: narrate(patient) };
}
