import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { PrognosisQuestionSnapshot } from '@platform/kernel/protocol';
import { supportsPrognosisQuestion, type PrognosisQuestionAction } from '../prognosis-question';

export const PROGNOSIS_QUESTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPrognosisQuestionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPrognosisQuestion(scenario);
}

export interface PrognosisQuestionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PrognosisQuestionAction; readonly finished?: boolean;
}

/**
 * The worked example for a number he asked for.
 *
 * The scenario decides what he repeats back from what was actually said: answer
 * without stating the direction of the error and the best case comes back alone,
 * as though it were the answer. So this example states the direction while there
 * is still time for it to land, and the difference shows up in the readback rather
 * than in the narration claiming it. That is the point worth demonstrating — not
 * that the right words were used, but that a different thing was heard.
 */
export function prognosisQuestionDemonstrationStep(
  patient?: PrognosisQuestionSnapshot,
): PrognosisQuestionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'His question in his own words, what he believed, what he was told, and what he took from it are handed over with the prognosis unsettled. This ends the example, not the conversation.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.intentAskedAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.06, action: 'ask-what-he-wants-to-know',
      narration: 'Ask what he wants to know before answering it. He has said he does not want all the details, and he has a reason for asking that decides which answer is useful. It costs one sentence, and it cannot be recovered afterwards.' };
  }
  if (patient.questionRecordedAtTick === null) {
    return { id: 'record', focus: 'actions', progress: 0.16, action: 'record-the-question-as-asked',
      narration: 'Record the question in his own words rather than paraphrasing it into a clinical one. The words he used are the record of what he asked, and they are what the next person needs.' };
  }
  if (patient.beliefCheckedAtTick === null) {
    return { id: 'belief', focus: 'actions', progress: 0.26, action: 'check-what-he-believes-the-treatment-is-for',
      narration: 'Check what he believes the treatment is for. An answer built on a different understanding than his lands somewhere nobody can see, and what he thinks is being attempted decides what any figure would mean to him.' };
  }
  if (patient.answeredAtTick === null) {
    return { id: 'answer', focus: 'actions', progress: 0.40, action: 'answer-with-scenarios-not-a-number',
      narration: 'Answer with scenarios rather than a number. A single figure is false precision; "nobody can know" is true and useless. Typical, worse and better together give him something he can plan against.' };
  }
  if (patient.directionStatedAtTick === null) {
    return { id: 'direction', focus: 'actions', progress: 0.54, action: 'state-the-direction-of-the-error',
      narration: 'Say which way the estimate is likely to be wrong, now, while it can still travel with the rest. This is the beat the lesson turns on: a best case offered without the shape around it comes back later as the whole answer, and by then it is where the next conversation has to start.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.64, action: 'review-boundaries',
      narration: 'Review what this conversation does not settle. No prognosis is established, nothing on the monitor bears on it, and a patient who seems comfortable is not evidence that anything landed.' };
  }
  if (!patient.readbackHeard) {
    return { id: 'observe', focus: 'monitor', progress: 0.78,
      narration: 'Give him room to say it back in his own words. This authored moment is a contrast rather than a required clinical wait. What he takes from it is the only measure of what was said.' };
  }
  if (!patient.readbackObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.90, action: 'reassess',
      narration: 'Take a current assessment of what was said and what was heard, because they are different things and only one of them is in the notes. He has repeated all three scenarios and the direction of the error — which is what stating it earlier bought.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off with the prognosis unsettled. A settled prognosis and a comfortable patient are not handoff gates. What travels is his question in his own words, what he believed the treatment was for, what he was told, and what he took from it.' };
}
