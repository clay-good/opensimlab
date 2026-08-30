import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { EasyLabelSnapshot } from '@platform/kernel/protocol';
export type { EasyLabelSnapshot } from '@platform/kernel/protocol';

/**
 * The last lesson in this module, and the one that refuses its central habit. Four of the others
 * teach a learner to hold a position while somebody urges action, which risks leaving them with a
 * rule that says wait. Here waiting is also wrong: the label is available and probably right, the
 * treatment for it is genuinely indicated, and the treatment for it is also what makes the
 * alternative worse. So the answer is neither of the two things on offer. It is refusing the
 * sequence they are offered in, and starting both at once.
 */
export const EASY_LABEL_HISTORY_TICKS = 20 * 60 * TICKS_PER_SECOND;
export const EASY_LABEL_TEAM_TICKS = 40 * 60 * TICKS_PER_SECOND;
export const EASY_LABEL_TAKEOVER_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const EASY_LABEL_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const EASY_LABEL_ACTIONS = ['record-that-the-label-is-a-diagnosis-of-exclusion',
  'record-what-has-not-been-excluded', 'escalate-so-both-can-start-together',
  'record-bounded-treatment-intent', 'review-boundaries',
  'check-observations', 'check-the-supplied-results', 'reassess', 'handoff',
  'start-immunosuppression-now-it-is-obviously-colitis', 'wait-for-every-result-before-telling-anyone',
  'no-fever-so-it-cannot-be-infection', 'four-cycles-in-so-it-is-the-drug'] as const;
export type EasyLabelAction = typeof EASY_LABEL_ACTIONS[number];
export interface EasyLabelEvent { readonly id: string; readonly message: string }

export function supportsEasyLabel(scenario: Scenario): boolean {
  return scenario.metadata.id === 'easy-label-a-label-that-fits-too-easily'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'easy-label').length === 1
    && scenario.timeline.filter((event) => event.target === 'easy-label-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'easy-label-boundary').length === 1;
}

export class EasyLabel {
  private exclusionAt: number | null = null;
  private outstandingAt: number | null = null;
  private escalationAt: number | null = null;
  private intentAt: number | null = null;
  private boundariesAt: number | null = null;
  private historySurfaced = false;
  private teamResponded = false;
  private teamObserved = false;
  private immunosuppressionAttempted = false;
  private waitForAllAttempted = false;
  private noFeverAttempted = false;
  private fourCyclesAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: EasyLabelSnapshot['observationRecord'] = null;
  private resultRecord: EasyLabelSnapshot['resultRecord'] = null;
  private observation: EasyLabelSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: EasyLabelSnapshot['ended'] = null;

  /**
   * What moves is the strength of the alternative. At twenty minutes a discharge summary already
   * in his record turns out to hold a recent admission and a course of antibiotics, which nobody
   * had opened. Nothing about him changes; what changes is how easily the label can be assumed.
   */
  private clinicalState() {
    return JSON.stringify([this.historySurfaced, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): EasyLabelEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? EASY_LABEL_TAKEOVER_TICKS : EASY_LABEL_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: EasyLabelEvent[] = [];
    if (!this.historySurfaced && until >= EASY_LABEL_HISTORY_TICKS) {
      this.change(() => { this.historySurfaced = true; });
      events.push({ id: 'history-surfaces', message: 'The discharge summary in his own record, three weeks old and never opened in this clinic, reports an admission with a chest infection and a course of antibiotics. Nothing about him has changed in the last twenty minutes. What has changed is how easily the obvious label can be assumed: the competing cause was always possible, and it is now considerably more than possible, and it was sitting in the record the whole time.' });
    }
    // Both halves start only when somebody with the authority to start them is told.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + EASY_LABEL_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The treating oncology team answers, with gastroenterology already on the call. They take ownership of the samples and of the treatment decision together rather than one behind the other, and they say the sentence this lesson is built around: the exclusion and the treatment are not a queue. They are two things that start now, and which one turns out to matter is decided by results that do not exist yet.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review that the label is a diagnosis of exclusion, what has not been excluded, escalating so both can start together, bounded treatment intent, and the boundaries. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): EasyLabelEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-that-the-label-is-a-diagnosis-of-exclusion':
        if (this.exclusionAt !== null) return events;
        this.exclusionAt = tick;
        return emit('exclusion-recorded', 'It is recorded that this label is a diagnosis of exclusion: it requires the exclusion of other competing causes, and the presentations of those causes are described as indistinguishable from it. That is not a caution attached to the diagnosis. It is the definition of the diagnosis, and a label that requires exclusion has not been made until the exclusion has happened.');
      case 'record-what-has-not-been-excluded':
        if (this.outstandingAt !== null) return events;
        this.outstandingAt = tick;
        return emit('outstanding-recorded', `The record names what has not been excluded rather than what has been assumed: no microbiological studies have been reported, and the competing infectious causes remain open${this.historySurfaced ? ', with recent antibiotics and a recent admission now visible in his own record' : ''}. Writing down which questions are unanswered is what stops the next person inheriting an answer nobody actually reached.`);
      case 'escalate-so-both-can-start-together':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The treating team is called and the request is deliberately for both at once: the samples that would exclude the competing causes, and the decision about treatment, arranged together rather than one after the other${this.historySurfaced ? ', with the recent antibiotics stated' : ''}. The choice being refused is not which of the two to do. It is the assumption that they are in a queue.`);
      case 'record-bounded-treatment-intent':
        if (this.intentAt !== null) return events;
        this.intentAt = tick;
        return emit('intent-recorded', 'Bounded intent is recorded and nothing is started: that the treating team and gastroenterology own which samples are taken, whether and when immunosuppression begins, what is given if a competing cause is found instead, and whether the checkpoint inhibitor continues. No drug, dose, route, grade threshold, or escalation agent is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, and they pull against each other on purpose. Guidelines universally recommend corticosteroids as initial management for this colitis at grade 2 or higher, so treating is genuinely indicated and delay is not a free action. And this colitis is a diagnosis of exclusion whose competing causes present indistinguishably, patients who have it are described as being at increased risk of infectious colitis, and microbiological studies should be performed first to exclude the common infectious causes before immunosuppression. Neither half can be dropped. What resolves them is not choosing between the two; it is that the samples and the escalation both take minutes, and only one of the two decisions has to wait for a result.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C; ${this.observationRecord.stoolsAboveBaseline} stools a day above his baseline; ${this.observationRecord.bloodInStool ? 'blood reported' : 'no blood reported'}. An absent fever is a finding about him, not about which cause this is. This partial check supplies no results.`);
      case 'check-the-supplied-results':
        this.resultRecord = this.resultFinding(tick);
        return emit('results-check', `Requested supplied results: ${this.resultRecord.microbiologyReported ? 'microbiology reported' : 'no microbiological studies reported'}; ${this.resultRecord.recentAntibiotics ? 'recent antibiotics and a recent admission are recorded in the discharge summary' : 'no recent antibiotic exposure has surfaced'}; cycle ${this.resultRecord.cyclesCompleted} of checkpoint treatment completed. No test is acquired or interpreted by this learner. This partial check supplies no observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.resultRecord = this.resultFinding(tick);
        this.observation = { ...this.observationRecord, ...this.resultRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.stoolsAboveBaseline} stools a day above baseline; ${view.bloodInStool ? 'blood reported' : 'no blood reported'}. He looks the same as he did, which distinguishes nothing. ${this.teamResponded ? 'The treating team and gastroenterology have answered and own the samples and the treatment decision together.' : this.historySurfaced ? 'Recent antibiotics and a recent admission are now visible in his own record.' : 'Nothing further has surfaced.'} No diagnosis beyond the supplied record, treatment effect, or outcome is established here.`);
      }
      case 'start-immunosuppression-now-it-is-obviously-colitis':
        this.immunosuppressionAttempted = true;
        return emit('immunosuppression-refused', 'Starting immunosuppression now on the obvious label was refused, and the reason is specific rather than general caution. The treatment for the assumed diagnosis is the thing that makes the competing one worse: the competing causes here are infections, they present indistinguishably, and patients with this colitis are described as being at increased risk of infectious colitis. This is not the ordinary cost of being wrong. It is a wrong answer whose treatment removes the chance to be right cheaply. It is also not this learner’s decision to make.');
      case 'wait-for-every-result-before-telling-anyone':
        this.waitForAllAttempted = true;
        return emit('wait-refused', 'Waiting for every result before telling anyone was refused, and it is the error this lesson exists to separate from the other one. Guidelines recommend corticosteroids as initial management at grade 2 or above, so delay is not the free option it feels like, and the team cannot arrange in an hour what they were told about in four. The samples and the phone call are not competing for the same minutes. Only the treatment decision has to wait for a result, and it is not yours.');
      case 'no-fever-so-it-cannot-be-infection':
        this.noFeverAttempted = true;
        return emit('no-fever-refused', 'Excluding infection because he has no fever was refused. The competing causes are described as clinically indistinguishable from this colitis, which is exactly why the diagnosis is one of exclusion and why the exclusion is microbiological rather than clinical. An absent fever tells you something true about him and nothing at all about which of the two causes is producing this.');
      case 'four-cycles-in-so-it-is-the-drug':
        this.fourCyclesAttempted = true;
        return emit('four-cycles-refused', 'Concluding that four cycles of the drug make this the drug was refused. The exposure is what puts this diagnosis on the list, and it is a good reason to think of it first; it is not a reason to stop there. A patient on this treatment can also acquire everything anyone else can acquire, and being on it is described as increasing that risk rather than reducing it. The exposure makes the label available. It does not make it correct.');
      case 'handoff':
        if (this.exclusionAt === null || this.outstandingAt === null || this.escalationAt === null
          || this.intentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record that the label is a diagnosis of exclusion, record what has not been excluded, escalate so the samples and the treatment decision start together, record bounded qualified-team intent, review the boundaries, and take a current assessment. A microbiological result, a started treatment, and a settled diagnosis are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The treating team and gastroenterology own the samples, whether and when immunosuppression begins, what is given if a competing cause is found, and whether the checkpoint inhibitor continues. What travels is that the label requires exclusion and the exclusion has not happened, which competing causes remain open, ${this.historySurfaced ? 'the recent admission and antibiotics found in his own record, ' : ''}the stool frequency above his baseline and when it began, ${this.immunosuppressionAttempted ? 'that treating first was considered and not taken, ' : ''}and ${this.teamObserved ? 'that both halves have been accepted and started together' : 'that the team has been called and has not yet answered'}. Practice ends, not care, and no diagnosis, treatment effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional diagnosis-of-exclusion lesson. No care was started.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 92,
      systolicMmHg: 118, diastolicMmHg: 72,
      respiratoryRateBpm: 18,
      spo2Percent: 97, coreTemperatureC: 36.8,
      stoolsAboveBaseline: 6,
      // Absent in every state, and absent on purpose: it excludes nothing.
      bloodInStool: false };
  }

  private resultFinding(tick: number) {
    return { atTick: tick, microbiologyReported: false,
      recentAntibiotics: this.historySurfaced, cyclesCompleted: 4 };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Unchanging, because looking at him is what neither distinguishes the two causes nor ever
    // will. The lesson is decided in the record and on the telephone.
    return { heartRateBpm: 92, systolicMmHg: 118, diastolicMmHg: 72,
      meanArterialMmHg: 87, respiratoryRateBpm: 18,
      spo2Percent: 97, coreTemperatureC: 36.8,
      alertness: 'alert, uncomfortable, and tired of the toilet' };
  }

  snapshot(_tick: number): EasyLabelSnapshot {
    return {
      exclusionRecordedAtTick: this.exclusionAt, outstandingRecordedAtTick: this.outstandingAt,
      escalationAtTick: this.escalationAt, treatmentIntentAtTick: this.intentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      stoolsAboveBaseline: 6,
      // False in every state. Microbiological exclusion is the only thing that would change it.
      competingCausesExcluded: false,
      historySurfaced: this.historySurfaced,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      immunosuppressionAttempted: this.immunosuppressionAttempted,
      waitForAllAttempted: this.waitForAllAttempted,
      noFeverAttempted: this.noFeverAttempted,
      fourCyclesAttempted: this.fourCyclesAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      resultRecord: this.resultRecord ? { ...this.resultRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
