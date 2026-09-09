import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { NegativeScanSnapshot } from '@platform/kernel/protocol';
export type { NegativeScanSnapshot } from '@platform/kernel/protocol';

/**
 * A scan that cannot say no.
 *
 * This lesson has a trap on each side and no safe middle. One side is the reflex that a raised
 * heart rate after bowel surgery means a leak; the published answer is that abnormal vital signs
 * are almost routine after bowel resection and the positive predictive value of any single
 * aberrant sign is 4 to 11 percent. The other side is the reflex that a reported negative
 * abdominal CT settles it; the published answer is that the sensitivity of that scan is not high
 * enough to exclude a leak, and that the patients whose reintervention was delayed by a
 * false-negative scan are the ones who died.
 *
 * So neither the number nor the scan decides. What decides is whether this patient is following
 * the course his own operation predicts, and the decision that follows belongs to the team that
 * made the anastomosis.
 */
export const NEGATIVE_SCAN_ROUND_TICKS = 45 * 60 * TICKS_PER_SECOND;
export const NEGATIVE_SCAN_TEAM_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const NEGATIVE_SCAN_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const NEGATIVE_SCAN_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const NEGATIVE_SCAN_ACTIONS = ['record-the-operative-course',
  'record-the-failure-to-progress', 'record-what-the-scan-excludes',
  'escalate-to-the-operating-team', 'record-bounded-surgical-intent', 'review-boundaries',
  'check-observations', 'check-operative-record', 'reassess', 'handoff',
  'the-scan-was-negative-so-it-is-not-a-leak', 'abnormal-vitals-are-routine-after-bowel-surgery',
  'repeat-the-scan-tomorrow-and-review-then', 'treat-the-numbers-and-watch-overnight'] as const;
export type NegativeScanAction = typeof NEGATIVE_SCAN_ACTIONS[number];
export interface NegativeScanEvent { readonly id: string; readonly message: string }

export function supportsNegativeScan(scenario: Scenario): boolean {
  return scenario.metadata.id === 'negative-scan-a-scan-that-cannot-say-no'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'negative-scan').length === 1
    && scenario.timeline.filter((event) => event.target === 'negative-scan-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'negative-scan-boundary').length === 1;
}

export class NegativeScan {
  private operativeCourseAt: number | null = null;
  private progressAt: number | null = null;
  private scanLimitsAt: number | null = null;
  private escalationAt: number | null = null;
  private surgicalIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private roundCompleted = false;
  private teamResponded = false;
  private teamObserved = false;
  private scanExclusionAttempted = false;
  private routineDismissalAttempted = false;
  private rescanDeferralAttempted = false;
  private treatTheNumbersAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: NegativeScanSnapshot['observationRecord'] = null;
  private operativeRecord: NegativeScanSnapshot['operativeRecord'] = null;
  private observation: NegativeScanSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: NegativeScanSnapshot['ended'] = null;

  /**
   * The observations barely move here, deliberately. A patient who crashed would turn this into
   * an ordinary sepsis drill and stop teaching the thing it exists to teach, so the freshness
   * gate watches what actually changes: how many hours the tachycardia has now been present,
   * whether the ward round has happened, and whether the operating team has answered.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.tachycardiaHours(), this.roundCompleted, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): NegativeScanEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? NEGATIVE_SCAN_TAKEOVER_TICKS : NEGATIVE_SCAN_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: NegativeScanEvent[] = [];
    if (!this.roundCompleted && until >= NEGATIVE_SCAN_ROUND_TICKS) {
      this.change(() => { this.roundCompleted = true; });
      events.push({ id: 'round-completed', message: 'The observations are repeated. Heart rate 110/min, blood pressure 110/68 mmHg, respiratory rate 22/min, temperature 37.4 C, oxygen saturation 95% in air — the same as they have been. He has vomited once since the last round, has still passed no flatus, and the analgesia requirement has not fallen. Nothing here declares itself. This is the fifth day and the seventh consecutive set with a heart rate above 100.' });
    }
    // The operating team answers only if it was called. Nobody arrives on their own, because the
    // failure this lesson teaches is a ward that keeps re-reading a scan instead of ringing them.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + NEGATIVE_SCAN_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The operating surgical team answers. They confirm the procedure, the anastomosis and the operative findings from their own record, state that a report of no evidence of a leak is not the same as no leak and does not override a patient who is not following the expected course, and take ownership of re-imaging, endoscopic assessment, and any decision to return to theatre.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded operative course, the failure to progress recorded against that course, what the reported scan does and does not exclude, and escalation to the team that made the anastomosis. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): NegativeScanEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-operative-course':
        if (this.operativeCourseAt !== null) return events;
        this.operativeCourseAt = tick;
        return emit('operative-course-recorded', 'The operation is recorded as the frame everything else is read against: a sigmoid resection with a primary colorectal anastomosis, five days ago, with no diverting stoma. What that operation predicts by day five is flatus, tolerated oral intake, and a falling analgesia requirement. The course is not an afterthought in this record; it is the reference the observations mean nothing without.');
      case 'record-the-failure-to-progress':
        if (this.progressAt !== null) return events;
        this.progressAt = tick;
        return emit('progress-recorded', `The trajectory is recorded against that expected course rather than as a list of numbers: no flatus by day five, oral intake not tolerated, an analgesia requirement that has risen rather than fallen, and a heart rate above 100 sustained across ${this.tachycardiaHours()} hours rather than found once. What is recorded is the divergence and its duration, because a single abnormal observation after bowel resection is close to routine and carries a positive predictive value of 4 to 11 percent, while a patient who has stopped following his own operation's course is a different statement.`);
      case 'record-what-the-scan-excludes':
        if (this.scanLimitsAt !== null) return events;
        this.scanLimitsAt = tick;
        return emit('scan-limits-recorded', 'What the scan can and cannot do is recorded explicitly. The report says no evidence of an anastomotic leak, which is not the same sentence as no leak. In one published colonic series the sensitivity of CT for leakage was 0.59 with a negative predictive value of 0.70 against a leak rate of 10.9 percent; in another it was 73 percent with a negative predictive value of 88 percent. Neither figure is high enough to turn this patient into a patient without a leak, and the small volume of free fluid and free gas reported is compatible with the expected appearances five days after this operation and with a leak.');
      case 'escalate-to-the-operating-team':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The team that made the anastomosis is contacted, ${this.roundCompleted ? 'with the operation, the failure to progress across five days, the vomit since the last round and the reported scan stated together' : 'with the operation, the failure to progress across five days and the reported scan stated together'}. The reason given is what is actually true: a patient who is not following the course his operation predicts, and an investigation that cannot exclude the complication being considered. This is not asking radiology to look again; it is returning the patient to the people who know what was done to him.`);
      case 'record-bounded-surgical-intent':
        if (this.surgicalIntentAt !== null) return events;
        this.surgicalIntentAt = tick;
        return emit('surgical-intent-recorded', 'Bounded intent is recorded and nothing is chosen: that the qualified surgical team may re-image with different technique or timing, may assess the anastomosis directly, and may decide to return to theatre, and that a decision to reoperate on this presentation is a clinical one that no scan result grants or withholds. No investigation, drug, dose, route, or operation is selected here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. In 452 consecutive bowel resections, tachycardia and tachypnoea were almost routine, occurring in more than half of patients repeatedly through the postoperative period, and the positive predictive value of any aberrant vital sign or white cell count for a leak or another complication ran between 4 and 11 percent. That study had 19 leaks among its 271 complications and its conclusion is that these signs do not identify them; it is not a licence to ignore a patient. On the other side, delayed reintervention after a false-negative scan carried a mortality of 62.5 percent in one series of eight such patients, and 45.5 percent against 4.2 percent in another. All three are small numbers from single centres, and none of them tells you what is happening in this abdomen. They establish only that neither the observation nor the scan can carry this decision on its own.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C; above 100 for ${this.observationRecord.tachycardiaHours} hours. This partial check supplies no operative record and no course.`);
      case 'check-operative-record':
        this.operativeRecord = this.operativeFinding(tick);
        return emit('operative-check', `Requested operative record: ${this.operativeRecord.procedure}, day ${this.operativeRecord.postoperativeDay}, ${this.operativeRecord.diverted ? 'with a diverting stoma' : 'with no diverting stoma'}; ${this.operativeRecord.flatusPassed ? 'flatus passed' : 'no flatus passed'}; ${this.operativeRecord.tolerating ? 'tolerating oral intake' : 'not tolerating oral intake'}; ${this.operativeRecord.imagingReport}. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.operativeRecord = this.operativeFinding(tick);
        this.observation = { ...this.observationRecord, ...this.operativeRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on air; temperature ${view.coreTemperatureC.toFixed(1)} C; above 100 for ${view.tachycardiaHours} hours; ${view.flatusPassed ? 'flatus passed' : 'no flatus'}; ${view.alertness}. ${this.teamResponded ? 'The operating team has answered and owns re-imaging, direct assessment, and any return to theatre; a report of no evidence of a leak does not override a patient off his expected course.' : 'The observations are almost unchanged and the course has not turned around.'} No diagnosis, leak, treatment effect, or outcome is established here.`);
      }
      case 'the-scan-was-negative-so-it-is-not-a-leak':
        this.scanExclusionAttempted = true;
        return emit('scan-exclusion-refused', 'Excluding a leak on the strength of the reported scan was refused. A negative predictive value of 0.70 to 0.88 does not turn this patient into a patient without a leak, and the report itself says no evidence of one rather than none. The series that measured this found that the patients whose reintervention was delayed by a false-negative scan were the ones who died, which is the specific harm this shortcut produces.');
      case 'abnormal-vitals-are-routine-after-bowel-surgery':
        this.routineDismissalAttempted = true;
        return emit('routine-dismissal-refused', 'Dismissing this as the ordinary postoperative noise was refused. The premise is right and the conclusion does not follow: abnormal signs are common and poorly predictive taken one at a time, which is a reason not to act on a single reading, not a reason to stop looking at a man who by day five has passed no flatus, is not eating, needs more analgesia than yesterday, and has been tachycardic for a day and a half. A statistic about isolated observations was applied to a trajectory.');
      case 'repeat-the-scan-tomorrow-and-review-then':
        this.rescanDeferralAttempted = true;
        return emit('rescan-deferral-refused', 'Repeating the scan tomorrow and reviewing then was refused. It answers the wrong question with the wrong instrument on the wrong clock: the investigation that already could not exclude this will not exclude it in the morning either, and the harm being avoided is measured in the delay itself. Selecting or timing imaging is in any case the operating team’s decision, and they have not been told.');
      case 'treat-the-numbers-and-watch-overnight':
        this.treatTheNumbersAttempted = true;
        return emit('treat-the-numbers-refused', 'Starting ward treatment aimed at the observations and watching overnight was refused. It would move the only signs anyone is following without changing what is happening in the abdomen, so the patient becomes harder to read while the clock the outcome depends on keeps running. Every treatment decision here belongs to the qualified team, and this lesson exposes no drug, no dose, and no route.');
      case 'handoff':
        if (this.operativeCourseAt === null || this.progressAt === null || this.scanLimitsAt === null
          || this.escalationAt === null || this.surgicalIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the operative course, record the failure to progress against it, record what the reported scan does and does not exclude, contact the operating team, record bounded qualified-team surgical intent, review the boundaries, and take a current full assessment. A confirmed leak, a repeat scan, and a decision about theatre are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns investigation, the decision to reoperate, and disposition. What travels is the operation and the day, the failure to progress recorded against the course that operation predicts, what the reported scan does and does not exclude, that the operating team was contacted, the bounded surgical intent as the qualified team’s decision, and ${this.teamObserved ? 'that the team confirmed the anastomosis from its own record and that a report of no evidence of a leak does not override the course' : 'that the operating team has been contacted and has not yet answered'}. Practice ends, not care, and no diagnosis or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional postoperative recognition lesson. No care was started.');
    }
  }

  private tachycardiaHours() { return this.roundCompleted ? 37 : 36; }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 110, systolicMmHg: 110, diastolicMmHg: 68,
      respiratoryRateBpm: 22, spo2Percent: 95, coreTemperatureC: 37.4,
      tachycardiaHours: this.tachycardiaHours() };
  }

  private operativeFinding(tick: number) {
    return { atTick: tick, procedure: 'sigmoid resection with a primary colorectal anastomosis',
      postoperativeDay: 5, diverted: false, flatusPassed: false, tolerating: false,
      imagingReport: 'the abdominal CT reported 18 hours ago says no evidence of an anastomotic leak, with a small volume of free fluid and free gas within expected postoperative appearances' };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Stable on purpose. The whole lesson is that this patient never gives anybody the crash
    // that would have made the decision for them.
    return { heartRateBpm: 110, systolicMmHg: 110, diastolicMmHg: 68, meanArterialMmHg: 82,
      respiratoryRateBpm: 22, spo2Percent: 95, coreTemperatureC: 37.4,
      alertness: 'alert, uncomfortable, and quieter than he was yesterday' };
  }

  snapshot(_tick: number): NegativeScanSnapshot {
    return {
      operativeCourseRecordedAtTick: this.operativeCourseAt,
      progressRecordedAtTick: this.progressAt,
      scanLimitsRecordedAtTick: this.scanLimitsAt,
      escalationAtTick: this.escalationAt,
      surgicalIntentAtTick: this.surgicalIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      postoperativeDay: 5,
      tachycardiaHours: this.tachycardiaHours(),
      // True in every state of this scenario: the report is the reason nobody has escalated.
      imagingReportedNegative: true,
      flatusPassed: false,
      roundCompleted: this.roundCompleted,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      scanExclusionAttempted: this.scanExclusionAttempted,
      routineDismissalAttempted: this.routineDismissalAttempted,
      rescanDeferralAttempted: this.rescanDeferralAttempted,
      treatTheNumbersAttempted: this.treatTheNumbersAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      operativeRecord: this.operativeRecord ? { ...this.operativeRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
