import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { FebrileNeutropeniaSnapshot } from '@platform/kernel/protocol';
import { supportsFebrileNeutropenia, type FebrileNeutropeniaAction } from '../febrile-neutropenia';
import { febrileNeutropeniaInlinePrompt } from '../febrile-neutropenia-tutor';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: FebrileNeutropeniaSnapshot): string {
  const prompt = febrileNeutropeniaInlinePrompt('guided', { scenarioVersion: '0.1.0', febrileNeutropenia: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const FEBRILE_NEUTROPENIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsFebrileNeutropeniaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsFebrileNeutropenia(scenario);
}

export interface FebrileNeutropeniaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: FebrileNeutropeniaAction; readonly finished?: boolean;
}

/**
 * The worked example for an examination that has been blinded.
 *
 * The patient looks well throughout, and the example does not resolve that: no
 * source appears, no culture returns, and nothing arrives to confirm that the
 * emergency was one. Every refused shortcut in this lesson is a missing signal
 * read as a reassuring one, so an example that supplied a source at the end
 * would teach that the decision was right because it turned out to be, which is
 * the reasoning the lesson exists to break.
 */
export function febrileNeutropeniaDemonstrationStep(
  patient?: FebrileNeutropeniaSnapshot,
): FebrileNeutropeniaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The count, the fever, and the recorded intent travel, along with the fact that the examination is blinded. No source was found and none was needed to justify any of it. This ends the example, not the episode.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.08, action: 'recognize-neutropenic-fever',
      narration: 'Record the emergency on the count and the fever alone: one temperature with neutrophils of 0.2, ten days after chemotherapy. How well he looks is not additional evidence — looking well is what this does early.' };
  }
  if (patient.pathwayAtTick === null) {
    return { id: 'pathway', focus: 'actions', progress: 0.22, action: 'activate-pathway',
      narration: 'Activate the pathway and the acute oncology team, and record the clock from arrival. This is the emergency response rather than a referral, and the recorded time is what makes the interval measurable later.' };
  }
  if (patient.culturesAtTick === null) {
    return { id: 'cultures', focus: 'actions', progress: 0.36, action: 'request-cultures',
      narration: 'Take cultures peripherally and from each line lumen, arranged so they do not delay therapy. The lumens answer a different question from the peripheral set, and no result from either is a prerequisite for treatment.' };
  }
  if (patient.antimicrobialIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.5, action: 'record-antimicrobial-intent',
      narration: 'Record bounded intent for immediate empiric intravenous therapy on the local protocol. The protocol names the agent; this bedside does not, and this example does not either.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.62, action: 'review-boundaries',
      narration: 'Review what the examination cannot show. The neutropenia is what removes the localizing signs and the white-cell rise, most episodes never localize, and the one-hour figure is a system-design safety margin rather than a physiological threshold.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.72, action: 'monitor',
      narration: 'Set continuous observation with a track-and-trigger score. A well-appearing neutropenic patient can decline quickly, and the examination will not warn you first — the score stands in for signs that are not available.' };
  }
  if (patient.responseDueInSeconds !== null) {
    return { id: 'observe', focus: 'monitor', progress: 0.82,
      narration: narrate(patient) };
  }
  if (!patient.untreatedResponseObserved && !patient.treatedResponseObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.9, action: 'reassess',
      narration: 'Take a current full assessment. A recorded intent is not an observed response, and the temperature, perfusion, and lactate in front of you now are the only description of where this has got to.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off an emergency without a source. A localized infection and a positive culture were never the gates, and most episodes never produce either — what travels is the count, the fever, the intent, and the blinded examination.' };
}
