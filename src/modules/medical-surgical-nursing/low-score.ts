import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LowScoreSnapshot } from '@platform/kernel/protocol';
export type { LowScoreSnapshot } from '@platform/kernel/protocol';

/**
 * A screening score with high sensitivity is not a rule-out test. This lesson exists because the
 * arithmetic is correct, the observations are real, and the conclusion drawn from them is still
 * wrong: "below the threshold" is being read as "excluded". Nothing here is performed incorrectly,
 * which is precisely what makes it hard to see.
 */
export const LOW_SCORE_FAMILY_CONCERN_TICKS = 20 * 60 * TICKS_PER_SECOND;
export const LOW_SCORE_REVIEW_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const LOW_SCORE_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const LOW_SCORE_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const LOW_SCORE_ACTIONS = ['record-observations-and-score', 'record-what-the-score-excludes',
  'record-the-family-report', 'escalate-on-concern', 'review-boundaries', 'monitor',
  'check-observations', 'check-context', 'reassess', 'handoff',
  'score-is-low-so-recheck-later', 'no-fever-so-not-infection', 'use-qsofa-instead',
  'document-and-move-on'] as const;
export type LowScoreAction = typeof LOW_SCORE_ACTIONS[number];
export interface LowScoreEvent { readonly id: string; readonly message: string }

export function supportsLowScore(scenario: Scenario): boolean {
  return scenario.metadata.id === 'low-score-what-the-threshold-does-not-exclude'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'low-score').length === 1
    && scenario.timeline.filter((event) => event.target === 'low-score-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'low-score-boundary').length === 1;
}

export class LowScore {
  private observationsAt: number | null = null;
  private exclusionsAt: number | null = null;
  private familyReportAt: number | null = null;
  private escalationAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private familyConcernRaised = false;
  private reviewArrived = false;
  private reviewObserved = false;
  private rechecked = false;
  private feverAssumed = false;
  private qsofaAttempted = false;
  private documentedOnly = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: LowScoreSnapshot['observationRecord'] = null;
  private contextRecord: LowScoreSnapshot['contextRecord'] = null;
  private observation: LowScoreSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: LowScoreSnapshot['ended'] = null;

  /**
   * The vitals and the score deliberately never move in this lesson, so a freshness gate built on
   * them alone would never fire and a reassessment taken before the review would satisfy handoff.
   * What changes is what a full assessment would report, so that is what the gate tracks.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.score(), this.familyConcernRaised, this.reviewArrived]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): LowScoreEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? LOW_SCORE_TAKEOVER_TICKS : LOW_SCORE_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: LowScoreEvent[] = [];
    if (!this.familyConcernRaised && until >= LOW_SCORE_FAMILY_CONCERN_TICKS) {
      this.change(() => { this.familyConcernRaised = true; });
      events.push({ id: 'family-concern', message: 'The daughter says it again, more plainly: she is not herself. She cannot name a sign and she is not describing anything the chart records. The score has not moved and neither have the observations.' });
    }
    // The review only happens if somebody asked for it. Nothing arrives on its own here, because
    // the failure this lesson teaches is precisely that nobody called.
    if (!this.reviewArrived && this.escalationAt !== null
      && until >= this.escalationAt + LOW_SCORE_REVIEW_TICKS) {
      this.change(() => { this.reviewArrived = true; });
      events.push({ id: 'review-arrived', message: 'The medical review happens. Blood cultures are taken and later grow a gram-negative organism, and the qualified team records that the patient met their criteria for treatment at the time of the call. The score at the time of the call was 2. It was 2 correctly: the observations were real and the arithmetic was right. The score was never the thing that was wrong.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded observations, what the score does and does not exclude, the family report, and escalation on concern rather than on threshold. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): LowScoreEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-observations-and-score':
        if (this.observationsAt !== null) return events;
        this.observationsAt = tick;
        return emit('observations-recorded', 'The observations are recorded as measured: respiratory rate 18, oxygen saturation 96% on air, no supplemental oxygen, systolic 118, heart rate 88, temperature 36.9, alert. The aggregate score is 2, and it is 2 correctly. Nothing here is a documentation failure, which is what makes the rest of this difficult.');
      case 'record-what-the-score-excludes':
        if (this.exclusionsAt !== null) return events;
        this.exclusionsAt = tick;
        return emit('exclusions-recorded', 'The record states what the score does and does not support. In a large cohort a score at this level had a sensitivity for sepsis around 87 percent, which means roughly one in eight patients with sepsis and a positive blood culture scored below the escalation threshold. The authors of that study wrote that a score below the threshold cannot definitively rule out sepsis. A screening instrument set to catch most people is not a test that clears this one.');
      case 'record-the-family-report':
        if (this.familyReportAt !== null) return events;
        this.familyReportAt = tick;
        return emit('family-report-recorded', 'The family report is recorded as evidence in its own right, in the words it was given: she is not herself. It is not converted into a number, because there is no field for it and inventing one would be a different kind of falsification. A relative reporting an unexplained change is information the scoring instrument does not collect.');
      case 'escalate-on-concern':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `Medical review is requested on recorded concern rather than on a threshold, ${this.familyConcernRaised ? 'with the family report and the unchanged observations stated together' : 'with the observations stated as they are'}. The reason given is what is actually true: the score is below the trigger, the observations are unremarkable, and there is a change nobody can account for. Escalating on that is not a breach of the protocol; the protocol's own guidance is that clinical concern overrides a low score.`);
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. The aggregate score is a screening instrument, not a diagnostic test, and its own validation reports a sensitivity that leaves a real miss rate. Roughly a third of older adults with serious infection are not febrile, and a normal temperature is therefore not reassurance. Rate-controlling medication blunts the tachycardia the score is partly built to detect. The current international sepsis guidance carries a strong recommendation against using one particular screening tool as a single instrument, on moderate-quality evidence, which is a reminder that these instruments are compared rather than trusted. None of this makes the score useless. It makes it a screen.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Increased observation frequency is arranged while the review is awaited. The interval is shortened because concern has been recorded, not because the score changed, and the record says so.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: respiratory rate ${this.observationRecord.respiratoryRateBpm}/min counted for a full minute; oxygen saturation ${this.observationRecord.spo2Percent}% on air; systolic ${this.observationRecord.systolicMmHg} mmHg; heart rate ${this.observationRecord.heartRateBpm}/min; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C; alert. Aggregate score ${this.observationRecord.aggregateScore}. This partial check supplies no new context about the patient's baseline or medication.`);
      case 'check-context':
        this.contextRecord = this.contextFinding(tick);
        return emit('context-check', `Requested context: ${this.contextRecord.rateControlMedication ? 'a rate-controlling medication is charted, so the heart rate is not free to rise' : 'no rate-controlling medication is charted'}; ${this.contextRecord.afebrileOlderAdult ? 'the patient is an older adult, in whom fever is frequently absent in serious infection' : 'fever would be expected here'}; baseline before this admission was ${this.contextRecord.baselineDescription}. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.contextRecord = this.contextFinding(tick);
        this.observation = { ...this.observationRecord, ...this.contextRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.reviewArrived) this.reviewObserved = true;
        const view = this.observation;
        return emit(this.reviewArrived ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on air; systolic ${view.systolicMmHg} mmHg; heart rate ${view.heartRateBpm}/min; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.alertness}. Aggregate score ${view.aggregateScore}. ${this.reviewArrived ? 'The review has happened and the cultures are positive; the score at the time of the call was still 2.' : 'Nothing in the scored observations has changed, and the concern has not gone away.'} No diagnosis, organism, treatment effect, or outcome is established here.`);
      }
      case 'score-is-low-so-recheck-later':
        this.rechecked = true;
        return emit('recheck-refused', 'Deferring on the strength of the low score was refused. The instrument’s own validation reports that a score below the threshold cannot definitively rule out sepsis, and roughly one in eight patients with sepsis and a positive blood culture scored below it. A recheck interval chosen because the number is low is a decision made by the number rather than about the patient.');
      case 'no-fever-so-not-infection':
        this.feverAssumed = true;
        return emit('fever-refused', 'Excluding infection on a normal temperature was refused. Roughly a third of older adults with serious infection are afebrile, and the temperature contributes to the very score that is already below its threshold. Using it twice does not make it stronger.');
      case 'use-qsofa-instead':
        this.qsofaAttempted = true;
        return emit('qsofa-refused', 'Substituting a more specific screening tool was refused. Current international sepsis guidance makes a strong recommendation, on moderate-quality evidence, against using that particular tool as a single screening instrument compared with the aggregate scores. Trading sensitivity for specificity in a screen is the wrong direction, and it does not address the concern that prompted the question.');
      case 'document-and-move-on':
        this.documentedOnly = true;
        return emit('documentation-refused', 'Recording the concern without acting on it was refused. In reviews of missed escalation, staff believed the situation was under control in about half of cases, and documentation without a call is the documented failure mode rather than a safeguard. A note that nobody reads is not an escalation.');
      case 'handoff':
        if (this.observationsAt === null || this.exclusionsAt === null || this.familyReportAt === null
          || this.escalationAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the observations and the score, record what the score does and does not exclude, record the family report in its own words, request review on concern, review the boundaries, arrange increased observation, and take a current full assessment. A rising score, a fever, and a confirmed organism are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the medical review, investigation, treatment, and any change to the observation plan. What travels is the recorded observations with the score as calculated, what the score does and does not exclude, the family report in the words it was given, that review was requested on concern rather than on threshold, and ${this.reviewObserved ? 'that the review confirmed treatment was warranted while the score at the time of the call was still 2' : 'that the review is still awaited'}. Practice ends, not care, and no diagnosis or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional early-warning lesson. No care was started.');
    }
  }

  private score() { return 2; }

  private observationFinding(tick: number) {
    return { atTick: tick, respiratoryRateBpm: 18, spo2Percent: 96, systolicMmHg: 118,
      heartRateBpm: 88, coreTemperatureC: 36.9, aggregateScore: this.score() };
  }

  private contextFinding(tick: number) {
    return { atTick: tick, rateControlMedication: true, afebrileOlderAdult: true,
      baselineDescription: 'independent, fully orientated, and described by her family as sharp' };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Nothing moves. If the observations drifted, the score would eventually trigger and the
    // lesson would collapse into an ordinary escalation drill.
    return { heartRateBpm: 88, systolicMmHg: 118, diastolicMmHg: 68, meanArterialMmHg: 85,
      respiratoryRateBpm: 18, spo2Percent: 96, coreTemperatureC: 36.9,
      alertness: 'alert and orientated, and not herself according to her family' };
  }

  snapshot(_tick: number): LowScoreSnapshot {
    return {
      observationsRecordedAtTick: this.observationsAt, exclusionsRecordedAtTick: this.exclusionsAt,
      familyReportRecordedAtTick: this.familyReportAt, escalationAtTick: this.escalationAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      aggregateScore: this.score(),
      // The score is below its own trigger in every state of this scenario. That is the point,
      // and it is reported as a fact rather than as reassurance.
      belowEscalationThreshold: true,
      familyConcernRaised: this.familyConcernRaised,
      reviewArrived: this.reviewArrived,
      reviewObserved: this.reviewObserved,
      recheckAttempted: this.rechecked,
      feverExclusionAttempted: this.feverAssumed,
      qsofaAttempted: this.qsofaAttempted,
      documentationOnlyAttempted: this.documentedOnly,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      contextRecord: this.contextRecord ? { ...this.contextRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
