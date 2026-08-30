import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PrognosisQuestionSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends a
 * reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a number he asked for.
 *
 * Nothing on the monitor answers this question, and the prompts have to resist the
 * pull of the two comfortable failures: a single number, which is false precision,
 * and "nobody can know", which is true and useless. What the lesson turns on is
 * that the answer he repeats back is produced by what was actually said — a best
 * case offered alone comes back as the whole answer — so the prompts push toward
 * finding out what he wants before answering it, and toward saying which way the
 * estimate is likely to be wrong while there is still time for it to land.
 */
export function prognosisQuestionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly prognosisQuestion?: PrognosisQuestionSnapshot;
}) {
  const patient = input.prognosisQuestion;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.intentAskedAtTick === null) return prompt('prognosis-question-intent', true,
    'Ask what he wants to know before answering it.',
    'He has said he does not want all the details, and he has a reason for asking that decides which answer is useful. It takes one sentence to find out, and it cannot be recovered once he has been given something he did not ask for.');
  if (patient.questionRecordedAtTick === null) return prompt('prognosis-question-record', true,
    'Record the question in his own words.',
    'Paraphrasing it into a clinical question loses what he is actually deciding. The words he used are the record of what he asked.');
  if (patient.beliefCheckedAtTick === null) return prompt('prognosis-question-belief', true,
    'Check what he believes the treatment is for.',
    'An answer built on a different understanding than his lands somewhere you cannot see. What he thinks is being attempted decides what the number would mean to him.');
  if (patient.answeredAtTick === null) return prompt('prognosis-question-answer', true,
    'Answer with scenarios rather than a single number.',
    'A single figure is false precision and "nobody can know" is true and useless. Typical, worse and better together give him something he can hold and plan against.');
  if (patient.directionStatedAtTick === null) return prompt('prognosis-question-direction', true,
    'Say which way the estimate is likely to be wrong, now rather than later.',
    'What he repeats back is produced by what was said. A best case offered without the shape around it comes back as the whole answer, and by then it is the thing the next conversation has to start from.');
  if (patient.boundariesReviewedAtTick === null) return prompt('prognosis-question-boundaries', true,
    'Review what this conversation does not settle.',
    'No prognosis is established here, nothing on the monitor bears on it, and a comfortable patient is not evidence that it landed.');
  if (!patient.readbackHeard) return prompt('prognosis-question-observe', false,
    'Give him room to say it back in his own words.',
    'This authored moment is a contrast rather than a required clinical wait. What he takes from it is the only measure of what was said, and it has not happened yet.');
  if (!patient.readbackObserved) return prompt('prognosis-question-reassess', true,
    'Take a current assessment of what was said and what was heard.',
    'The two are different things, and only one of them is in your notes. Which he repeats back decides what the next conversation has to begin from.');
  return prompt('prognosis-question-handoff', false,
    'Hand off with the prognosis unsettled.',
    'A settled prognosis and a comfortable patient are not handoff gates. What travels is his question in his own words, what he believed, what he was told, and what he took from it.');
}
