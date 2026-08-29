import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { QuietPatientSnapshot } from '@platform/kernel/protocol';
export type { QuietPatientSnapshot } from '@platform/kernel/protocol';

/**
 * Screening tools are calibrated on the presentation that attracts attention. The hypoactive
 * subtype is the most prevalent and the most missed, and the screen that would find it is the one
 * most often deferred, because a quiet patient looks like a patient who does not need screening.
 * The absence of a positive result is being produced by the screening process itself.
 */
export const QUIET_PATIENT_HANDOVER_TICKS = 25 * 60 * TICKS_PER_SECOND;
export const QUIET_PATIENT_REVIEW_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const QUIET_PATIENT_TAKEOVER_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const QUIET_PATIENT_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const QUIET_PATIENT_ACTIONS = ['review-the-charted-impression', 'screen-for-arousal',
  'record-the-screen-result', 'escalate-on-the-positive-screen', 'review-boundaries', 'monitor',
  'check-chart', 'check-patient', 'reassess', 'handoff',
  'let-them-sleep-and-screen-later', 'quiet-is-settled', 'negative-earlier-screen-excludes',
  'call-it-low-mood'] as const;
export type QuietPatientAction = typeof QUIET_PATIENT_ACTIONS[number];
export interface QuietPatientEvent { readonly id: string; readonly message: string }

/** Three shifts of charted impressions, none of which records a screen being performed. */
export const QUIET_PATIENT_CHARTED_IMPRESSIONS = [
  'Resting comfortably. No concerns.',
  'Settled overnight. Slept well.',
  'Quiet. Declined breakfast.',
] as const;

export function supportsQuietPatient(scenario: Scenario): boolean {
  return scenario.metadata.id === 'quiet-patient-a-screen-that-was-never-done'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'quiet-patient').length === 1
    && scenario.timeline.filter((event) => event.target === 'quiet-patient-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'quiet-patient-boundary').length === 1;
}

export class QuietPatient {
  private impressionsReviewedAt: number | null = null;
  private screenedAt: number | null = null;
  private resultRecordedAt: number | null = null;
  private escalationAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private handoverRepeated = false;
  private reviewArrived = false;
  private reviewObserved = false;
  private deferredScreen = false;
  private quietRead = false;
  private earlierScreenTrusted = false;
  private moodAttributed = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private chartRecord: QuietPatientSnapshot['chartRecord'] = null;
  private patientRecord: QuietPatientSnapshot['patientRecord'] = null;
  private observation: QuietPatientSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: QuietPatientSnapshot['ended'] = null;

  // Screening is what changes the state of knowledge. The patient looks the same either way.
  private clinicalState() { return JSON.stringify([this.screenedAt !== null, this.reviewArrived]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): QuietPatientEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? QUIET_PATIENT_TAKEOVER_TICKS : QUIET_PATIENT_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: QuietPatientEvent[] = [];
    if (!this.handoverRepeated && until >= QUIET_PATIENT_HANDOVER_TICKS) {
      this.handoverRepeated = true;
      events.push({ id: 'handover-repeated', message: 'The outgoing nurse adds it to the handover in the same words as the previous two shifts: resting comfortably, no concerns. Nothing has been screened. A fourth entry is about to be written that reads exactly like the first three.' });
    }
    if (!this.reviewArrived && this.escalationAt !== null
      && until >= this.escalationAt + QUIET_PATIENT_REVIEW_TICKS) {
      this.change(() => { this.reviewArrived = true; });
      events.push({ id: 'review-arrived', message: 'The medical review happens on the positive screen. The qualified team performs their own assessment, reaches the same conclusion, and records that the preceding three shifts contain no screening result of any kind, positive or negative. There was nothing to disagree with, which is the finding.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the charted impressions, a screen actually performed, the result recorded, and escalation on it. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): QuietPatientEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'review-the-charted-impression':
        if (this.impressionsReviewedAt !== null) return events;
        this.impressionsReviewedAt = tick;
        return emit('impressions-reviewed', `The last three shifts read: ${QUIET_PATIENT_CHARTED_IMPRESSIONS.map((entry) => `"${entry}"`).join(', ')}. Every one of them is an impression, and not one of them is a screening result. There is no negative screen in this record, because there is no screen in this record. Absence of a positive finding is not the same as a negative finding, and only one of those two things is in front of you.`);
      case 'screen-for-arousal':
        if (this.screenedAt !== null) return events;
        this.change(() => { this.screenedAt = tick; });
        return emit('screened', 'The screen is performed rather than deferred. He is rousable but slow to respond, cannot give the months backwards, is inattentive within a few seconds, and his family say this is not how he was at home a week ago. That is a positive screen. Nothing about him changed in the last minute; what changed is that the tool was used.');
      case 'record-the-screen-result':
        if (this.screenedAt === null) {
          return emit('result-refused', 'There is no result to record. No screen has been performed in this rehearsal, and recording an impression in the place a screening result belongs is how the last three shifts happened.');
        }
        if (this.resultRecordedAt !== null) return events;
        this.resultRecordedAt = tick;
        return emit('result-recorded', 'The result is recorded as a screening result, with the tool named, the time taken, and the components that were positive. It sits alongside the earlier impressions rather than replacing them, because the three shifts of "resting comfortably" are themselves evidence of how the absence was produced.');
      case 'escalate-on-the-positive-screen':
        if (this.screenedAt === null) {
          return emit('escalation-refused', 'There is nothing to escalate. Escalating on an impression is the pattern this lesson is about; a screen has to be performed first.');
        }
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', 'Medical review is requested on a positive screen, stated as a screening result with its components rather than as a worry about how he seems. The three prior shifts of impressions are given alongside it, because the reviewer needs to know that the record contains no earlier screen to compare against.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. The hypoactive subtype is the most prevalent, at about half of cases in reported series, and the most frequently missed; it is regularly read as depression, fatigue, or a patient who is no trouble. Screening accuracy depends heavily on conditions: in a multicentre study under routine use the 4AT reached a sensitivity of 76 percent and the CAM 40 percent, so a negative result from either is weak evidence of absence and a negative CAM in particular excludes very little. Impaired arousal is itself scoreable, so a patient who is drowsy is a patient who can be screened rather than one who must be left. None of this establishes a cause for this man or predicts what the review will find.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Screening is scheduled at defined intervals rather than left to whoever notices something, and the schedule is recorded with its reason. Delirium fluctuates, so a single result is a point rather than a line, and an interval nobody wrote down is an interval that will be skipped on a busy shift.');
      case 'check-chart':
        this.chartRecord = this.chartFinding(tick);
        return emit('chart-check', `Requested chart review: ${this.chartRecord.impressions.length} consecutive shift entries, ${this.chartRecord.screenResults} recorded screening results, ${this.chartRecord.shifts} shifts. Observations, food and fluid charts, and pressure-area care are all completed at every entry. The gap is specific rather than general neglect. This partial review supplies no assessment of the patient.`);
      case 'check-patient':
        this.patientRecord = this.patientFinding(tick);
        return emit('patient-check', `Requested observation: ${this.patientRecord.rousable ? 'rousable' : 'not rousable'}; ${this.patientRecord.attentive ? 'attentive' : 'inattentive within seconds'}; ${this.patientRecord.agitated ? 'agitated' : 'not agitated'}; ${this.patientRecord.familyReportsChange ? 'family report a change from a week ago' : 'no family report available'}. ${this.screenedAt === null ? 'These are observations, not a screening result.' : 'A screening result is already recorded.'} This partial observation supplies no chart context.`);
      case 'reassess': {
        this.chartRecord = this.chartFinding(tick);
        this.patientRecord = this.patientFinding(tick);
        this.observation = { ...this.chartRecord, ...this.patientRecord };
        this.observedPhase = this.phase;
        if (this.reviewArrived) this.reviewObserved = true;
        const view = this.observation;
        return emit(this.reviewArrived ? 'reviewed-reassessment' : this.screenedAt !== null ? 'screened-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: ${view.rousable ? 'rousable' : 'not rousable'}, ${view.attentive ? 'attentive' : 'inattentive within seconds'}, ${view.agitated ? 'agitated' : 'not agitated'}; ${view.screenResults} screening results in the record across ${view.shifts} shifts. ${this.reviewArrived ? 'The review has happened and recorded that the preceding shifts contain no screening result of any kind.' : this.screenedAt !== null ? 'The screen has been performed and is positive; the earlier shifts still contain none.' : 'No screen has been performed in this rehearsal, so there is still nothing to compare against.'} No diagnosis, cause, or outcome is established here.`);
      }
      case 'let-them-sleep-and-screen-later':
        this.deferredScreen = true;
        return emit('deferral-refused', 'Deferring the screen because he is asleep was refused. Impaired arousal is a scoreable component rather than a reason to postpone, and deferral is the mechanism that produced three shifts without a result. A screen put off until he seems more awake is a screen weighted toward finding nothing.');
      case 'quiet-is-settled':
        this.quietRead = true;
        return emit('quiet-refused', 'Reading quiet as settled was refused. The hypoactive subtype is about half of cases in reported series and the most frequently missed, precisely because it does not ask for attention. Quietness is the finding here, not the reassurance.');
      case 'negative-earlier-screen-excludes':
        this.earlierScreenTrusted = true;
        return emit('earlier-screen-refused', 'Relying on an earlier negative screen was refused, and in this record there is no earlier screen to rely on: three shifts of impressions contain no result of any kind. Even where one exists, delirium fluctuates and a negative result is a point rather than a line, with the CAM reaching only 40 percent sensitivity under routine multicentre conditions.');
      case 'call-it-low-mood':
        this.moodAttributed = true;
        return emit('mood-refused', 'Attributing it to low mood was refused. Hypoactive delirium is regularly misread as depression, and settling on that explanation at the bedside forecloses the assessment that would distinguish them. Naming what is observed and screening for it is the move available here; deciding which condition it is belongs to the review.');
      case 'handoff':
        if (this.impressionsReviewedAt === null || this.screenedAt === null || this.resultRecordedAt === null
          || this.escalationAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Review the charted impressions, perform the screen rather than defer it, record the result as a screening result, escalate on it, review the boundaries, schedule repeat screening, and take a current full assessment. A settled cause and a resolved diagnosis are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the review, investigation, and every treatment decision. What travels is the three shifts of impressions exactly as written, the screen performed and its positive components, the result recorded as a screening result rather than an impression, the repeat schedule, and ${this.reviewObserved ? 'that the review found no earlier screening result to compare against' : 'that the review is still awaited'}. Practice ends, not care, and no cause or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional screening lesson. No care was started.');
    }
  }

  private chartFinding(tick: number) {
    return { atTick: tick, impressions: [...QUIET_PATIENT_CHARTED_IMPRESSIONS],
      screenResults: this.resultRecordedAt === null ? 0 : 1, shifts: 3 };
  }

  private patientFinding(tick: number) {
    return { atTick: tick, rousable: true, attentive: false, agitated: false,
      familyReportsChange: true };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Observations are unremarkable throughout, which is why three shifts of charts look complete.
    return { heartRateBpm: 82, systolicMmHg: 126, diastolicMmHg: 74, meanArterialMmHg: 91,
      respiratoryRateBpm: 16, spo2Percent: 96, coreTemperatureC: 36.8,
      alertness: 'rousable, slow to respond, and inattentive within seconds' };
  }

  snapshot(_tick: number): QuietPatientSnapshot {
    return {
      impressionsReviewedAtTick: this.impressionsReviewedAt, screenedAtTick: this.screenedAt,
      resultRecordedAtTick: this.resultRecordedAt, escalationAtTick: this.escalationAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      chartedImpressions: [...QUIET_PATIENT_CHARTED_IMPRESSIONS],
      // Zero until a screen is actually performed and recorded. Impressions never count.
      recordedScreenResults: this.resultRecordedAt === null ? 0 : 1,
      screenPositive: this.screenedAt !== null,
      handoverRepeated: this.handoverRepeated,
      reviewArrived: this.reviewArrived,
      reviewObserved: this.reviewObserved,
      deferralAttempted: this.deferredScreen,
      quietReadAsSettled: this.quietRead,
      earlierScreenTrusted: this.earlierScreenTrusted,
      moodAttributed: this.moodAttributed,
      chartRecord: this.chartRecord ? { ...this.chartRecord } : null,
      patientRecord: this.patientRecord ? { ...this.patientRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
