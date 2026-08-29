import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { CountedRateSnapshot } from '@platform/kernel/protocol';
export type { CountedRateSnapshot } from '@platform/kernel/protocol';

/**
 * The most predictive vital sign is the least reliably measured one. A column of estimated numbers
 * is indistinguishable from a stable patient, and the lesson is that "no change in the trend" can
 * be a property of the documentation process rather than of the person in the bed.
 */
export const COUNTED_RATE_REVIEW_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const COUNTED_RATE_TAKEOVER_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const COUNTED_RATE_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const COUNTED_RATE_ACTIONS = ['review-the-charted-trend', 'count-for-a-full-minute',
  'record-the-discrepancy', 'escalate-on-the-counted-value', 'review-boundaries', 'monitor',
  'check-chart', 'check-patient', 'reassess', 'handoff',
  'trust-the-flat-trend', 'chart-the-monitor-value', 'round-to-the-previous-entry',
  'correct-the-earlier-entries'] as const;
export type CountedRateAction = typeof COUNTED_RATE_ACTIONS[number];
export interface CountedRateEvent { readonly id: string; readonly message: string }

/** Six night-shift entries, as charted. The clustering on 18 and 20 is the finding. */
export const COUNTED_RATE_CHARTED_TREND = [18, 18, 20, 18, 18, 20] as const;
export const COUNTED_RATE_COUNTED_VALUE = 28;

export function supportsCountedRate(scenario: Scenario): boolean {
  return scenario.metadata.id === 'counted-rate-a-number-nobody-counted'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'counted-rate').length === 1
    && scenario.timeline.filter((event) => event.target === 'counted-rate-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'counted-rate-boundary').length === 1;
}

export class CountedRate {
  private trendReviewedAt: number | null = null;
  private countedAt: number | null = null;
  private discrepancyAt: number | null = null;
  private escalationAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private reviewArrived = false;
  private reviewObserved = false;
  private trendTrusted = false;
  private monitorCharted = false;
  private roundedToPrevious = false;
  private retrospectiveEdit = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private chartRecord: CountedRateSnapshot['chartRecord'] = null;
  private patientRecord: CountedRateSnapshot['patientRecord'] = null;
  private observation: CountedRateSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: CountedRateSnapshot['ended'] = null;

  // Counting is what changes the state of knowledge here, so the freshness gate tracks it rather
  // than the vitals, which the charted column claims have not moved for six shifts.
  private clinicalState() {
    return JSON.stringify([this.countedAt !== null, this.reviewArrived]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): CountedRateEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? COUNTED_RATE_TAKEOVER_TICKS : COUNTED_RATE_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: CountedRateEvent[] = [];
    if (!this.reviewArrived && this.escalationAt !== null
      && until >= this.escalationAt + COUNTED_RATE_REVIEW_TICKS) {
      this.change(() => { this.reviewArrived = true; });
      events.push({ id: 'review-arrived', message: 'The medical review happens on the counted rate. The qualified team records their own count and reaches the same number, and notes that the charted column gave no indication of it. Nothing about the patient changed between the last charted entry and the count. What changed was that somebody counted.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the charted trend, a rate counted for a full minute, the discrepancy recorded rather than resolved, and escalation on the counted value. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): CountedRateEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'review-the-charted-trend':
        if (this.trendReviewedAt !== null) return events;
        this.trendReviewedAt = tick;
        return emit('trend-reviewed', `The charted respiratory rates for the last six entries are ${COUNTED_RATE_CHARTED_TREND.join(', ')}. Read as a trend, that is a stable patient. Read as a distribution, it is six values drawn from a set of two, which is what estimation looks like when it is written down. Studies of how the rate is actually recorded describe exactly this clustering on 18 and 20, and describe rates being entered without being counted.`);
      case 'count-for-a-full-minute':
        if (this.countedAt !== null) return events;
        this.change(() => { this.countedAt = tick; });
        return emit('counted', `Counted for a full sixty seconds: ${COUNTED_RATE_COUNTED_VALUE} per minute. Nothing else about the patient has changed and no other observation is new. The difference between this number and the column above it is not a change in the patient; it is the difference between counting and estimating.`);
      case 'record-the-discrepancy':
        if (this.countedAt === null) {
          return emit('discrepancy-refused', 'There is nothing to record yet. A discrepancy needs two numbers, and only the charted column exists so far.');
        }
        if (this.discrepancyAt !== null) return events;
        this.discrepancyAt = tick;
        return emit('discrepancy-recorded', `The record states both numbers and does not reconcile them: the charted entries read ${COUNTED_RATE_CHARTED_TREND.join(', ')}, and a rate counted for a full minute is ${COUNTED_RATE_COUNTED_VALUE}. The earlier entries stay as they were written, because they are somebody else's observation and altering them would destroy the only evidence that the trend was unreliable. The discrepancy is the finding.`);
      case 'escalate-on-the-counted-value':
        if (this.countedAt === null) {
          return emit('escalation-refused', 'There is no counted value to escalate on yet. Escalating on the charted column would be escalating on the estimate.');
        }
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `Review is requested on the counted rate of ${COUNTED_RATE_COUNTED_VALUE}, stated as counted for a full minute, alongside the charted column exactly as it stands. Both numbers are given, because the reviewer needs to know that the record they will look at does not show this.`);
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. Respiratory rate is the single strongest predictor of in-hospital cardiac arrest among the routine observations, and it is also the one most often estimated rather than counted; reviews of ward documentation report it recorded far less reliably than the others and clustered on a handful of values. A rising rate precedes desaturation, so a normal oxygen saturation does not make the rate redundant. Whether a monitor-derived rate is equivalent to a counted one is not established in the retrievable evidence, so this lesson does not claim it either way.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Increased observation frequency is arranged, with the rate counted for a full minute each time rather than estimated. The interval and the counting method are both recorded, because a shortened interval filled with estimates measures nothing new.');
      case 'check-chart':
        this.chartRecord = this.chartFinding(tick);
        return emit('chart-check', `Requested chart review: the last six respiratory rates are ${this.chartRecord.entries.join(', ')}, across ${this.chartRecord.shifts} shifts, taking ${this.chartRecord.distinctValues} distinct values. Oxygen saturation, pulse, and blood pressure are charted at every entry. This partial review supplies no new observation of the patient.`);
      case 'check-patient':
        this.patientRecord = this.patientFinding(tick);
        return emit('patient-check', `Requested observation: respiratory rate ${this.patientRecord.countedRate} counted for a full minute; oxygen saturation ${this.patientRecord.spo2Percent}% on air; ${this.patientRecord.usingAccessoryMuscles ? 'accessory muscle use present' : 'no accessory muscle use'}; ${this.patientRecord.speakingFullSentences ? 'speaking in full sentences' : 'speaking in short phrases'}. This partial observation supplies no chart context.`);
      case 'reassess': {
        this.chartRecord = this.chartFinding(tick);
        this.patientRecord = this.patientFinding(tick);
        this.observation = { ...this.chartRecord, ...this.patientRecord };
        this.observedPhase = this.phase;
        if (this.reviewArrived) this.reviewObserved = true;
        const view = this.observation;
        return emit(this.reviewArrived ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: charted rates ${view.entries.join(', ')}; counted rate ${view.countedRate}; oxygen saturation ${view.spo2Percent}% on air; ${view.speakingFullSentences ? 'speaking in full sentences' : 'speaking in short phrases'}. ${this.reviewArrived ? 'The qualified team counted independently and reached the same number, and recorded that the chart gave no indication of it.' : this.countedAt === null ? 'No rate has been counted for a full minute in this rehearsal yet, so the only respiratory rate available is the charted one.' : 'The charted column is unchanged and will stay unchanged, because it is a record of what was written rather than of what was measured.'} No diagnosis, cause, or outcome is established here.`);
      }
      case 'trust-the-flat-trend':
        this.trendTrusted = true;
        return emit('trend-refused', 'Reading the flat trend as a stable patient was refused. Six entries taking two distinct values is the documented signature of estimation rather than measurement, and a column of estimates is stable whatever the patient is doing. The trend cannot be evidence of stability until at least one of its entries was counted.');
      case 'chart-the-monitor-value':
        this.monitorCharted = true;
        return emit('monitor-refused', 'Charting the monitor-derived rate in place of a counted one was refused. Whether ward impedance-derived rates agree with counting is not established in the retrievable evidence, and this lesson will not assert an equivalence it cannot source. Recording it as a counted rate would also misdescribe how it was obtained.');
      case 'round-to-the-previous-entry':
        this.roundedToPrevious = true;
        return emit('rounding-refused', 'Recording a value close to the previous entry was refused. That is the mechanism that produced the column in the first place: each entry anchored to the last one until the number stopped describing anybody.');
      case 'correct-the-earlier-entries':
        this.retrospectiveEdit = true;
        return emit('retrospective-edit-refused', 'Amending the earlier entries was refused. They are another clinician’s contemporaneous record, and rewriting them would destroy the only evidence that the trend was unreliable. The discrepancy is recorded alongside them instead, which is both honest and more useful.');
      case 'handoff':
        if (this.trendReviewedAt === null || this.countedAt === null || this.discrepancyAt === null
          || this.escalationAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Review the charted trend, count for a full minute, record the discrepancy without resolving it, escalate on the counted value, review the boundaries, arrange increased observation with counting, and take a current full assessment. A corrected chart and an explained cause are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the review, any investigation, and every treatment decision. What travels is the charted column exactly as written, the rate counted for a full minute, the discrepancy recorded rather than reconciled, that escalation was made on the counted value, and ${this.reviewObserved ? 'that an independent count reached the same number while the chart still showed nothing' : 'that the review is still awaited'}. Practice ends, not care, and no cause or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional observation lesson. No care was started.');
    }
  }

  private chartFinding(tick: number) {
    return { atTick: tick, entries: [...COUNTED_RATE_CHARTED_TREND], shifts: 3,
      distinctValues: new Set(COUNTED_RATE_CHARTED_TREND).size };
  }

  private patientFinding(tick: number) {
    return { atTick: tick, countedRate: COUNTED_RATE_COUNTED_VALUE, spo2Percent: 95,
      usingAccessoryMuscles: false, speakingFullSentences: true };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // The real rate was always 28. Nothing about the patient changes when it is counted; only
    // what is known changes.
    return { heartRateBpm: 96, systolicMmHg: 124, diastolicMmHg: 72, meanArterialMmHg: 89,
      respiratoryRateBpm: COUNTED_RATE_COUNTED_VALUE, spo2Percent: 95, coreTemperatureC: 37.2,
      alertness: 'alert and speaking in full sentences' };
  }

  snapshot(_tick: number): CountedRateSnapshot {
    return {
      trendReviewedAtTick: this.trendReviewedAt, countedAtTick: this.countedAt,
      discrepancyRecordedAtTick: this.discrepancyAt, escalationAtTick: this.escalationAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      chartedEntries: [...COUNTED_RATE_CHARTED_TREND],
      countedRate: this.countedAt === null ? null : COUNTED_RATE_COUNTED_VALUE,
      reviewArrived: this.reviewArrived,
      reviewObserved: this.reviewObserved,
      trendTrusted: this.trendTrusted,
      monitorCharted: this.monitorCharted,
      roundedToPrevious: this.roundedToPrevious,
      retrospectiveEditAttempted: this.retrospectiveEdit,
      chartRecord: this.chartRecord ? { ...this.chartRecord } : null,
      patientRecord: this.patientRecord ? { ...this.patientRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
