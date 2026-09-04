import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsDelirium, type DeliriumAction, type DeliriumProgress,
} from '../acute-delirium-reversible-causes';
import { deliriumInlinePrompt } from '../tutor/acute-delirium-reversible-causes-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: DeliriumProgress): string {
  const prompt = deliriumInlinePrompt('guided', { scenarioVersion: '0.1.0', delirium: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const DELIRIUM_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDeliriumDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDelirium(scenario);
}

export interface DeliriumDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: DeliriumAction; readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis that lives in the baseline.
 *
 * An eighty-two-year-old with fluctuating confusion is read as dementia unless
 * somebody establishes who she was this morning, and the person who can say so
 * is her daughter. The other refusal is a single cause: the six-hour review
 * finds a full bladder, an antihistamine, poor intake, pain, broken sleep and
 * hearing aids in a drawer — none of them the cause, all of them contributors.
 * This example scores nobody, assesses no capacity, selects no restraint or
 * observation level, and chooses no drug.
 */
export function deliriumDemonstrationStep(
  patient?: DeliriumProgress,
): DeliriumDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on better and not back, with six things being fixed and none of them called the cause. Nothing was proven and nothing was excluded — not the contributors, not her capacity, not whether she returns to who she was. This ends the example, not the delirium.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient',
      narration: 'Start with who she was at eight this morning, and let her daughter tell you. Independently living, managing her own medicines and finances, conversing normally, with no diagnosed cognitive disorder — confirmed by family for eight o’clock today. Ten hours later she alternates between withdrawal with slow responses and restless periods pulling at the bed linen, and twice pointed at children she believed were in the room. The withdrawn stretches are part of this rather than the quiet in between it, which is the half that gets recorded as settled.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-neurology-delirium-indicators-and-qualified-assessment-boundary-without-dementia-or-single-cause-closure',
      narration: narrate(patient) };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.46, action: 'activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership',
      narration: narrate(patient) };
  }
  if (patient.boundaryAtTick === null) {
    return { id: 'boundary', focus: 'monitor', progress: 0.64, action: 'review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary',
      narration: 'Work the ordinary contributors, and keep safety least-restrictive. Oxygenation, infection, hydration, medicines, pain, retention, constipation, nutrition, sensory aids, sleep and mobility are the list, and the environment is part of it: consistency, reassurance, and a room that is easier to understand. Her hearing aids are in the bedside drawer. De-escalation and least-restrictive safety come before anything else — no restraint, no observation level and no drug is selected here.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s 6-hour report. The interval is a contrast rather than a required wait, and nothing here says what any individual patient recovers.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk',
    narration: 'The review found 690 mL in her bladder before the team drained it, diphenhydramine 25 mg given eight hours before the first recorded change, poor oral intake, movement-related pain, fragmented sleep and the hearing aids still out of her ears. She now recognizes her daughter and the hospital and still loses the task after three months backward. That is improvement without resolution, so hand off the causes, the capacity question, the safety, the medicines, the function, the recurrence risk and the follow-up — and name no single cause.' };
}
