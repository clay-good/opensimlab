import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { PrognosisQuestionSnapshot } from '@platform/kernel/protocol';
export type { PrognosisQuestionSnapshot } from '@platform/kernel/protocol';

/**
 * Nothing on the monitor answers this one. The lesson exists because the two comfortable replies —
 * a single number, and "nobody can know" — are both refusals dressed as answers, and because the
 * evidence says the warmer the relationship, the likelier the person leaves misinformed. What the
 * learner does here is heard back later in the patient's own words, which is the only honest test
 * of whether an answer landed.
 */
export const PROGNOSIS_QUESTION_REPEAT_TICKS = 20 * 60 * TICKS_PER_SECOND;
export const PROGNOSIS_QUESTION_READBACK_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const PROGNOSIS_QUESTION_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const PROGNOSIS_QUESTION_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const PROGNOSIS_QUESTION_ACTIONS = ['ask-what-he-wants-to-know',
  'record-the-question-as-asked', 'check-what-he-believes-the-treatment-is-for',
  'answer-with-scenarios-not-a-number', 'state-the-direction-of-the-error', 'review-boundaries',
  'check-observations', 'check-what-was-said', 'reassess', 'handoff',
  'give-a-single-number', 'say-nobody-can-know', 'reassure-and-move-on',
  'answer-before-asking-what-he-wants'] as const;
export type PrognosisQuestionAction = typeof PROGNOSIS_QUESTION_ACTIONS[number];
export interface PrognosisQuestionEvent { readonly id: string; readonly message: string }

export function supportsPrognosisQuestion(scenario: Scenario): boolean {
  return scenario.metadata.id === 'prognosis-question-a-number-he-asked-for'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'prognosis-question').length === 1
    && scenario.timeline.filter((event) => event.target === 'prognosis-question-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'prognosis-question-boundary').length === 1;
}

export class PrognosisQuestion {
  private askedAt: number | null = null;
  private questionRecordedAt: number | null = null;
  private beliefCheckedAt: number | null = null;
  private answeredAt: number | null = null;
  private directionStatedAt: number | null = null;
  private boundariesAt: number | null = null;
  private askedAgain = false;
  private readbackHeard = false;
  private readbackObserved = false;
  private singleNumberAttempted = false;
  private nobodyKnowsAttempted = false;
  private reassuranceAttempted = false;
  private prematureAnswerAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: PrognosisQuestionSnapshot['observationRecord'] = null;
  private conversationRecord: PrognosisQuestionSnapshot['conversationRecord'] = null;
  private observation: PrognosisQuestionSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: PrognosisQuestionSnapshot['ended'] = null;

  /**
   * Nothing physiological moves here at all, so the freshness gate tracks the conversation: what
   * he has asked, and what he has said back. Those are the only things a reassessment can report.
   */
  private clinicalState() {
    return JSON.stringify([this.askedAgain, this.readbackHeard, this.readback()]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  /**
   * What he heard, which is decided by what was actually said rather than by what was meant.
   *
   * Frozen at the moment he says it. Computing it live let a direction of error stated after he
   * had already spoken rewrite what he had said in the corridor, which is the one thing this
   * lesson must never do: a conversation that has happened cannot be improved retrospectively.
   */
  private spokenReadback: PrognosisQuestionSnapshot['readback'] = null;
  private readback(): PrognosisQuestionSnapshot['readback'] {
    return this.spokenReadback;
  }

  advance(tick: number): PrognosisQuestionEvent[] {
    if (this.ended) return [];
    const terminal = this.answeredAt === null ? PROGNOSIS_QUESTION_TAKEOVER_TICKS : PROGNOSIS_QUESTION_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: PrognosisQuestionEvent[] = [];
    if (!this.askedAgain && until >= PROGNOSIS_QUESTION_REPEAT_TICKS) {
      this.change(() => { this.askedAgain = true; });
      events.push({ id: 'asked-again', message: 'He asks again, and this time says why: his daughter is getting married in four months, and he has been asked whether to book anything. He is not asking for a prognosis. He is asking whether to buy a suit, and he has been carrying the question for a fortnight.' });
    }
    // What he repeats back is produced by what was said, not by what was intended. A best case
    // offered on its own comes back as the whole answer, because that is how it was heard.
    if (!this.readbackHeard && this.answeredAt !== null
      && until >= this.answeredAt + PROGNOSIS_QUESTION_READBACK_TICKS) {
      this.change(() => {
        this.readbackHeard = true;
        this.spokenReadback = this.directionStatedAt === null ? 'best-case-only' : 'all-three-scenarios';
      });
      events.push(this.directionStatedAt === null
        ? { id: 'readback-best-case', message: 'He repeats it back to his daughter in the corridor, and what he repeats is the best case, on its own, as though it were the answer: he has heard he could have a couple of years. The other two scenarios were said and are gone. Nothing was misheard; a range without its shape collapses to the end of it a person can bear.' }
        : { id: 'readback-scenarios', message: 'He repeats it back to his daughter in the corridor, and he repeats all three: that most people in his position have around the middle figure, that some have a quarter of it, and that some have three times it, and that nobody yet knows which he is. He adds, unprompted, that he was told doctors tend to guess long. He has the shape of it, not a number.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review asking what he wanted to know before answering it, the question recorded in his own words, what he believes the treatment is for, an answer given as scenarios rather than a number, and the direction of the error stated out loud. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): PrognosisQuestionEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'ask-what-he-wants-to-know':
        if (this.askedAt !== null) return events;
        this.askedAt = tick;
        return emit('intent-asked', `He is asked what he wants the number for, and what he would rather not be told. ${this.askedAgain ? 'He has already said it: there is a wedding in four months and a decision about whether to book anything.' : 'He says he has thought about little else for a fortnight, and that he does not want "all the details" — which is not the same as not wanting an answer.'} The question behind the question decides which answer is useful, and it costs one sentence to find out.`);
      case 'record-the-question-as-asked':
        if (this.questionRecordedAt !== null) return events;
        this.questionRecordedAt = tick;
        return emit('question-recorded', 'The question goes into the record in his words — "how long have I got" — with the date, who was in the room, and what he said he wanted it for. It is not translated into "patient asked about prognosis", because the next person to see him needs to know what he actually asked and how he asked it, and a paraphrase is where that is usually lost.');
      case 'check-what-he-believes-the-treatment-is-for':
        if (this.beliefCheckedAt !== null) return events;
        this.beliefCheckedAt = tick;
        return emit('belief-checked', 'He is asked what he understands the current treatment to be for. He says he assumes it is to get rid of it. That is not a failure of his: in a study of 1193 patients on chemotherapy for incurable lung or colorectal cancer, 69 percent and 81 percent respectively did not report understanding that it was not at all likely to cure them, and the patients who rated communication with their physician most favourably were the likeliest to believe it. Answering the survival question on top of that belief answers a different question than the one he thinks he is asking.');
      case 'answer-with-scenarios-not-a-number':
        if (this.askedAt === null) {
          return emit('answer-refused', 'Answering before asking what he wants to know was refused. He has already said he does not want "all the details", and there is a reason behind the question that changes which answer helps. One sentence establishes both; guessing at them does not.');
        }
        if (this.answeredAt !== null) return events;
        this.answeredAt = tick;
        return emit('answered', 'He is given three scenarios rather than a number, built around a typical figure: that around half of people in his position live longer than it and half shorter, that around one in ten live a quarter of it or less, and that around one in ten live three times it or more. In the study of this method, the observed survival of 63 percent of patients fell between half and double their oncologist’s estimate, 6 percent lived a quarter of it or less, and 14 percent lived three times it or more. He is told which of those a wedding in four months sits inside, and that nobody yet knows which he is.');
      case 'state-the-direction-of-the-error':
        if (this.answeredAt === null) {
          return emit('direction-refused', 'Stating the direction of the error before there is an estimate to attach it to was refused. It qualifies an answer, and there is no answer yet.');
        }
        if (this.directionStatedAt !== null) return events;
        this.directionStatedAt = tick;
        return emit('direction-stated', 'He is told which way the estimate is likely to be wrong, and that this is a property of the people making it rather than of him. In a cohort of 468 terminally ill patients, only 20 percent of doctors’ survival predictions were accurate to within a third, 63 percent were over-optimistic, and the estimates were long by a factor of about five. The doctors who had known their patients longest were the least accurate of all. Saying so out loud is not undermining the answer; it is the part of the answer that keeps him from planning on the best case.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. The optimism figure comes from a hospice-referral cohort with a median survival of 24 days, so its size does not transfer to a man on second-line treatment; what transfers is the direction, which was consistent across doctors and patients. The scenario method was measured on 114 patients of 21 oncologists with a median survival of 11 months, and the estimates behind it were imprecise: only 29 percent fell within a third of the observed time. None of these figures is this man’s. They describe how well the people answering his question tend to do, which is the only thing that can honestly be said about an answer nobody can check in advance.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. They are unremarkable, and none of them answers what he asked. This partial check supplies nothing about the conversation.`);
      case 'check-what-was-said':
        this.conversationRecord = this.conversationFinding(tick);
        return emit('conversation-check', `Requested conversation record: the question was ${this.conversationRecord.questionRecorded ? 'recorded in his own words' : 'not recorded'}; what he wants it for was ${this.conversationRecord.purposeKnown ? 'established' : 'not established'}; what he believes the treatment is for was ${this.conversationRecord.beliefChecked ? 'checked' : 'not checked'}; an answer was ${this.conversationRecord.answerGiven ? 'given as scenarios' : 'not given'}; the direction of the error was ${this.conversationRecord.directionStated ? 'stated' : 'not stated'}. This partial check supplies no observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.conversationRecord = this.conversationFinding(tick);
        this.observation = { ...this.observationRecord, ...this.conversationRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.readbackHeard) this.readbackObserved = true;
        const view = this.observation;
        return emit(this.readbackHeard ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.alertness}. ${this.readbackHeard ? (this.readback() === 'best-case-only' ? 'What he has repeated back is the best case alone.' : this.readback() === 'all-three-scenarios' ? 'What he has repeated back is all three scenarios and the direction of the error.' : 'He has nothing to repeat back, because he was not answered.') : 'Nothing here has changed, and nothing here was ever going to answer his question.'} No prognosis, treatment effect, or outcome is established by this rehearsal.`);
      }
      case 'give-a-single-number':
        this.singleNumberAttempted = true;
        return emit('single-number-refused', 'Giving him one number was refused. A single figure is a prediction that will be wrong in a known direction — 63 percent of such predictions were over-optimistic and long by roughly a factor of five — and it is heard as a date. What makes a number useful to him is its shape: a typical figure, a worse case, a better one, and which of them a wedding in four months sits inside.');
      case 'say-nobody-can-know':
        this.nobodyKnowsAttempted = true;
        return emit('nobody-knows-refused', 'Telling him nobody can know was refused. It is true and it is not an answer; it leaves him to fill the silence with whichever end of the range he can bear, and it is usually the best one. Uncertainty is the reason to give him the shape of the estimate, not a reason to withhold it.');
      case 'reassure-and-move-on':
        this.reassuranceAttempted = true;
        return emit('reassurance-refused', 'Reassuring him and moving on was refused. In the study of what patients on incurable chemotherapy believe, the people who rated communication with their doctor most favourably were about twice as likely to hold an inaccurate belief about what the treatment could do. A comfortable conversation is not evidence that anything was understood, and this is the finding that makes that measurable rather than a matter of opinion.');
      case 'answer-before-asking-what-he-wants':
        this.prematureAnswerAttempted = true;
        return emit('premature-refused', 'Answering first and asking afterwards was refused. He has said he does not want "all the details", and he has a reason for asking that decides which answer is useful. Both take one sentence to find out, and neither can be recovered once he has been given something he did not ask for.');
      case 'handoff':
        if (this.askedAt === null || this.questionRecordedAt === null || this.beliefCheckedAt === null
          || this.answeredAt === null || this.directionStatedAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Ask what he wants to know, record the question in his own words, check what he believes the treatment is for, answer with scenarios rather than a number, state which way the estimate is likely to be wrong, review the boundaries, and take a current assessment of what was said and heard. A settled prognosis and a comfortable patient are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns every future conversation, the treatment decisions, and any change of intent. What travels is the question in his own words with what he said he wanted it for, that he believed the treatment was to get rid of it and what was said about that, that he was answered with three scenarios rather than a number, that the direction of the error was stated, and ${this.readbackObserved ? (this.readback() === 'best-case-only' ? 'that what he repeated back was the best case alone, which is the thing the next conversation has to start from' : 'that what he repeated back was all three scenarios and the direction of the error') : 'that what he has taken from it has not yet been heard back'}. Practice ends, not care, and no prognosis or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional prognosis-conversation lesson. No care was started.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 82, systolicMmHg: 124, diastolicMmHg: 72,
      respiratoryRateBpm: 16, spo2Percent: 97, coreTemperatureC: 36.7 };
  }

  private conversationFinding(tick: number) {
    return { atTick: tick, questionRecorded: this.questionRecordedAt !== null,
      purposeKnown: this.askedAt !== null, beliefChecked: this.beliefCheckedAt !== null,
      answerGiven: this.answeredAt !== null, directionStated: this.directionStatedAt !== null };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Deliberately unremarkable and deliberately irrelevant. There is no observation in this
    // lesson that bears on the question being asked, and that is worth a learner noticing.
    return { heartRateBpm: 82, systolicMmHg: 124, diastolicMmHg: 72, meanArterialMmHg: 89,
      respiratoryRateBpm: 16, spo2Percent: 97, coreTemperatureC: 36.7,
      alertness: 'alert, orientated, and waiting for an answer' };
  }

  snapshot(_tick: number): PrognosisQuestionSnapshot {
    return {
      intentAskedAtTick: this.askedAt, questionRecordedAtTick: this.questionRecordedAt,
      beliefCheckedAtTick: this.beliefCheckedAt, answeredAtTick: this.answeredAt,
      directionStatedAtTick: this.directionStatedAt, boundariesReviewedAtTick: this.boundariesAt,
      // No observation in this lesson bears on the question, in any state.
      observationsAnswerTheQuestion: false,
      askedAgain: this.askedAgain,
      readbackHeard: this.readbackHeard,
      readbackObserved: this.readbackObserved,
      readback: this.readback(),
      singleNumberAttempted: this.singleNumberAttempted,
      nobodyKnowsAttempted: this.nobodyKnowsAttempted,
      reassuranceAttempted: this.reassuranceAttempted,
      prematureAnswerAttempted: this.prematureAnswerAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      conversationRecord: this.conversationRecord ? { ...this.conversationRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
