import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsCroup, type CroupAction, type CroupProgress } from '../croup';
import { croupInlinePrompt } from '../tutor/croup-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: CroupProgress): string {
  const prompt = croupInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const CROUP_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCroupDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCroup(scenario);
}

export interface CroupDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CroupAction; readonly finished?: boolean;
}

/**
 * The worked example for a child who gets worse if you upset her.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The example takes none of the four refusals, and never once
 * moves her: it examines no mouth or throat, scores, diagnoses, tests, images
 * or swabs nothing, identifies no pathogen, chooses no drug, dose, route,
 * concentration, repeat interval, oxygen target, flow, interface or
 * nebulizer, performs no airway maneuver, ventilation, intubation or
 * procedure, and determines no discharge or admission.
 */
export function croupDemonstrationStep(
  patient?: CroupProgress,
): CroupDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She never left her caregiver’s arms, nobody looked in her throat, and the people who could open her airway were there before anyone needed them to. She is better than she was, on a treatment that wears off, with the readiness still in place for if it does. This ends the example, not the evaluation.' };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.1, action: 'reconcile-croup-whole-child-upper-airway-pattern',
      narration: narrate(patient) };
  }
  if (patient.severityAtTick === null) {
    return { id: 'severity', focus: 'monitor', progress: 0.28, action: 'review-croup-severity-and-alternative-red-flags',
      narration: narrate(patient) };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'treatment', focus: 'actions', progress: 0.46, action: 'record-croup-minimal-distress-support-and-qualified-treatment-intent',
      narration: narrate(patient) };
  }
  if (patient.earlyResponseAtTick === null) {
    return { id: 'early', focus: 'monitor', progress: 0.64, action: 'review-croup-early-response',
      narration: narrate(patient) };
  }
  if (patient.recurrenceAtTick === null) {
    return { id: 'recurrence', focus: 'monitor', progress: 0.8, action: 'review-croup-recurrence-and-preserve-airway-readiness',
      narration: narrate(patient) };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-croup-active-upper-airway-risk',
    narration: narrate(patient) };
}
