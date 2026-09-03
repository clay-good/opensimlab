import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { InheritedUrgencySnapshot } from '@platform/kernel/protocol';
import { supportsInheritedUrgency, type InheritedUrgencyAction } from '../inherited-urgency';
import { inheritedUrgencyInlinePrompt } from '../inherited-urgency-tutor';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: InheritedUrgencySnapshot): string {
  const prompt = inheritedUrgencyInlinePrompt('guided', { scenarioVersion: '0.1.0', inheritedUrgency: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const INHERITED_URGENCY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsInheritedUrgencyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsInheritedUrgency(scenario);
}

export interface InheritedUrgencyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: InheritedUrgencyAction; readonly finished?: boolean;
}

/**
 * The worked example for an emergency that mostly is not one.
 *
 * The hard beat is a refusal, and the scenario puts it on the clock: a radiation
 * oncology registrar rings back with a slot tonight and a willingness to use it.
 * Declining is harder than accepting, because accepting looks like decisiveness
 * and like taking a colleague's help. So the example passes through that moment
 * rather than finishing before it, and says what is needed instead.
 */
export function inheritedUrgencyDemonstrationStep(
  patient?: InheritedUrgencySnapshot,
): InheritedUrgencyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'Which findings would make this an emergency, that they are absent, and who now owns the biopsy are handed over with the diagnosis unmade. This ends the example, not the pathway.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.findingsRecordedAtTick === null) {
    return { id: 'findings', focus: 'actions', progress: 0.07, action: 'record-the-findings-that-would-make-it-an-emergency',
      narration: 'Record which findings would make this an emergency and whether they are present. That is a question with an answer. Whether the referral sounded urgent is not, and it is the only thing anybody has checked so far.' };
  }
  if (patient.tissueRecordedAtTick === null) {
    return { id: 'tissue', focus: 'actions', progress: 0.18, action: 'record-that-the-tissue-decides-the-treatment',
      narration: 'Record that the tissue decides the treatment. What is done depends on what this is, and nobody knows that yet. Treating first makes the diagnosis harder to get and no less necessary.' };
  }
  if (patient.pathwaySecuredAtTick === null) {
    return { id: 'pathway', focus: 'actions', progress: 0.32, action: 'secure-the-diagnostic-pathway',
      narration: 'Secure the diagnostic pathway rather than a treatment slot. The genuinely time-critical thing here is a biopsy booked, flagged and owned by a named team — that is the appointment worth chasing tonight.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.44, action: 'record-bounded-treatment-intent',
      narration: narrate(patient) };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.55, action: 'review-boundaries',
      narration: 'Review what is not settled. No histology, no staging and no treatment decision is available here, and a man who is comfortable now is not a guarantee that he stays so.' };
  }
  if (!patient.treatmentOffered) {
    return { id: 'observe-offer', focus: 'monitor', progress: 0.66,
      narration: 'Keep the pathway rather than the slot in view. This authored interval is a contrast rather than a required clinical wait, and something is about to be offered that is easier to accept than to decline.' };
  }
  if (!patient.teamResponded) {
    return { id: 'hold', focus: 'monitor', progress: 0.80,
      narration: 'The radiation oncology registrar has a slot tonight and is willing to use it. Nothing about that offer is wrong and nothing about it is unkind — it is simply upstream of the tissue. The example declines the slot without declining the help, and says what is needed instead: the biopsy she is trying to help you get around.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.90, action: 'reassess',
      narration: 'Take a current assessment now acute oncology has accepted him and the biopsy is booked and flagged. Whether the emergency findings have appeared is the thing that would change any of this, and only a current look answers it.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: narrate(patient) };
}
