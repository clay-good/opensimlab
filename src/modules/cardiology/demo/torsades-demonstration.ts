import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsTorsades, type TorsadesAction, type TorsadesProgress,
} from '../torsades';
import { torsadesInlinePrompt } from '../tutor/torsades-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied. Every lesson's prose used to ship twice inside the
 * cockpit bundle — once in the tutor and once as a duplicated string literal
 * here — and gzip cannot reach across that distance to dedupe it. Deriving it
 * also makes "the two cannot drift apart" structural rather than a property
 * maintained by regenerating this file.
 */
function narrate(patient: TorsadesProgress): string {
  const prompt = torsadesInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const TORSADES_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTorsadesDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTorsades(scenario);
}

export interface TorsadesDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TorsadesAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a rhythm whose name is the thing that slows people
 * down.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the last pair is unordered the example reviews the cause
 * before recording the suppression intent — a choice, not a rule. It examines
 * nobody, acquires or interprets no pulse, ECG, monitor, laboratory or imaging
 * data, diagnoses no cause, selects no energy or sedation, operates no
 * defibrillator, delivers no shock, CPR, oxygen, magnesium, electrolyte,
 * medication, infusion, pacing or isoproterenol, assesses no capture, chooses
 * no device, determines no disposition, and predicts no outcome.
 */
export function torsadesDemonstrationStep(
  patient?: TorsadesProgress,
): TorsadesDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is in sinus rhythm at 52 with a QT nobody has shortened, a potassium and a magnesium nobody has yet corrected, and a medication nobody has yet stopped. The shock was the easy part and somebody else delivered it. The order was the lesson: electricity first because she was failing, and the cause afterwards because that is when there was time. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.1, action: 'reconcile-torsades-pulse-and-pattern',
      narration: narrate(patient) };
  }
  if (patient.shockIntentAtTick === null) {
    return { id: 'shock', focus: 'actions', progress: 0.26, action: 'record-torsades-unsynchronized-shock-intent',
      narration: narrate(patient) };
  }
  if (patient.postShockAtTick === null) {
    return { id: 'postshock', focus: 'monitor', progress: 0.44, action: 'review-torsades-post-shock-rhythm',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'parallel', focus: 'monitor', progress: 0.6, action: 'review-torsades-long-qt-context',
      narration: narrate(patient) };
  }
  if (patient.recurrenceIntentAtTick === null) {
    return { id: 'recurrence', focus: 'actions', progress: 0.78, action: 'record-torsades-recurrence-suppression-intent',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-torsades-recurrence-plan',
    narration: narrate(patient) };
}
