import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { SilentInteractionSnapshot } from '@platform/kernel/protocol';
import { supportsSilentInteraction, type SilentInteractionAction } from '../silent-interaction';
import { silentInteractionInlinePrompt } from '../silent-interaction-tutor';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: SilentInteractionSnapshot): string {
  const prompt = silentInteractionInlinePrompt('guided', { scenarioVersion: '0.1.0', silentInteraction: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const SILENT_INTERACTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSilentInteractionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSilentInteraction(scenario);
}

export interface SilentInteractionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SilentInteractionAction; readonly finished?: boolean;
}

/**
 * The worked example for a harm with nothing to find.
 *
 * Nothing becomes abnormal in this lesson, at any point, however long it runs. A
 * demonstration is the wrong shape for that by default: it wants a moment where
 * the thing it warned about shows up and vindicates the beat before it. Here there
 * is no such moment, and the example has to be worth watching without one — which
 * is the same difficulty the learner has in passing the problem on.
 */
export function silentInteractionDemonstrationStep(
  patient?: SilentInteractionSnapshot,
): SilentInteractionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'What she takes, which way the interaction runs, and who now owns it are handed over, with everything about her still normal. This ends the example, not the problem.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.reconciledAtTick === null) {
    return { id: 'reconcile', focus: 'actions', progress: 0.08, action: 'reconcile-what-she-is-actually-taking',
      narration: 'Reconcile what she is actually taking rather than what a list says. The lists disagree with each other, and none of them is describing her. What she swallows is answerable by asking her, which is the only source here that is not a copy of another.' };
  }
  if (patient.directionRecordedAtTick === null) {
    return { id: 'direction', focus: 'actions', progress: 0.20, action: 'record-the-interaction-and-its-direction',
      narration: 'Record the interaction and which way it runs. The direction is the whole finding: a drug whose absorption is reduced produces nothing to see. That is why nothing being wrong is not evidence that nothing is happening.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.34, action: 'escalate-to-the-treating-team-now',
      narration: 'Tell her treating team now rather than writing it in the notes. A note is not a handover, and the decision that follows — whether the acid suppression is still needed, whether something without this interaction would do — has to be made by someone rather than recorded by everyone.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.46, action: 'record-bounded-treatment-intent',
      narration: 'Record bounded intent and tell her to change nothing. Instructing her to stop a tablet is prescribing, and it is not this learner’s to do; she is also entitled to keep taking what she was told to take until somebody who owns it says otherwise.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.57, action: 'review-boundaries',
      narration: 'Review what is not settled. No level is measurable here and no effect on her treatment is demonstrable, and the absence of both is the situation rather than a reassurance about it.' };
  }
  if (!patient.pharmacyRecordArrived) {
    return { id: 'observe', focus: 'monitor', progress: 0.68,
      narration: 'Wait for the dispensing record before deciding the lists agree. This authored interval is a contrast rather than a required clinical wait.' };
  }
  if (!patient.teamResponded) {
    return { id: 'hold', focus: 'monitor', progress: 0.80,
      narration: 'The pharmacy list is a third version and matches neither of the others. Three records, no two the same, and she remains the only source describing what she actually swallows. Nothing has turned abnormal while you waited, and nothing was going to.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.90, action: 'reassess',
      narration: 'Take a current assessment now her team has taken it. It is normal, and recording that is the point rather than a formality: the handover here is that a well patient has a real problem, which is harder to pass on than an abnormal one.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: narrate(patient) };
}
