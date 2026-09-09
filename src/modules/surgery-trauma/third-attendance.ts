import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { ThirdAttendanceSnapshot } from '@platform/kernel/protocol';
export type { ThirdAttendanceSnapshot } from '@platform/kernel/protocol';

/**
 * A question two people have already answered.
 *
 * Both previous entries are accurate. On Sunday she had generalised abdominal pain and was
 * sent home; on Tuesday it was recorded as settling and she was sent home again. Neither
 * clinician did anything wrong, and neither of those entries is evidence about Thursday — they
 * are records of what was looked for at two earlier moments, by people who did not have this
 * one.
 *
 * It is the module's fourth lesson about holding a position, and the pressure is new. In
 * `negative-scan` the pressure is an investigation, in `unfinished-survey` a bed, in
 * `quiet-chest` a patient who wants to go home. Here it is two colleagues' conclusions, and
 * the authored beat makes holding harder rather than easier: the clinician who saw her on
 * Tuesday puts her head round the door and says she was fine then.
 */
export const THIRD_ATTENDANCE_COLLEAGUE_TICKS = 12 * 60 * TICKS_PER_SECOND;
export const THIRD_ATTENDANCE_TEAM_TICKS = 40 * 60 * TICKS_PER_SECOND;
export const THIRD_ATTENDANCE_TAKEOVER_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const THIRD_ATTENDANCE_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const THIRD_ATTENDANCE_ACTIONS = ['record-the-attendances-and-what-each-found',
  'record-what-a-previous-assessment-can-say', 'record-what-has-changed-since-the-last-visit',
  'escalate-to-the-surgical-team', 'record-bounded-assessment-intent', 'review-boundaries',
  'check-observations', 'check-attendance-record', 'reassess', 'handoff',
  'she-has-been-seen-twice-already', 'the-notes-say-it-was-settling',
  'she-is-anxious-and-keeps-coming-back', 'discharge-her-with-the-same-advice-again'] as const;
export type ThirdAttendanceAction = typeof THIRD_ATTENDANCE_ACTIONS[number];
export interface ThirdAttendanceEvent { readonly id: string; readonly message: string }

export function supportsThirdAttendance(scenario: Scenario): boolean {
  return scenario.metadata.id === 'third-attendance-a-question-two-people-have-already-answered'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'third-attendance').length === 1
    && scenario.timeline.filter((event) => event.target === 'third-attendance-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'third-attendance-boundary').length === 1;
}

export class ThirdAttendance {
  private attendancesAt: number | null = null;
  private priorLimitsAt: number | null = null;
  private changeAt: number | null = null;
  private escalationAt: number | null = null;
  private assessmentIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private colleagueSpoke = false;
  private teamResponded = false;
  private teamObserved = false;
  private seenTwiceAttempted = false;
  private settlingClaimAttempted = false;
  private anxiousClaimAttempted = false;
  private sameAdviceAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: ThirdAttendanceSnapshot['observationRecord'] = null;
  private attendanceRecord: ThirdAttendanceSnapshot['attendanceRecord'] = null;
  private observation: ThirdAttendanceSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: ThirdAttendanceSnapshot['ended'] = null;

  /**
   * Nothing measured moves. What the freshness gate has to track is the social state of the
   * room, because the only thing that changes in this lesson is how hard the position is to
   * hold.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.colleagueSpoke, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): ThirdAttendanceEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? THIRD_ATTENDANCE_TAKEOVER_TICKS : THIRD_ATTENDANCE_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: ThirdAttendanceEvent[] = [];
    if (!this.colleagueSpoke && until >= THIRD_ATTENDANCE_COLLEAGUE_TICKS) {
      this.change(() => { this.colleagueSpoke = true; });
      events.push({ id: 'colleague-spoke', message: 'The clinician who saw her on Tuesday puts her head round the door on her way past. She remembers the patient, says she was fine on Tuesday and was told to come back if it got worse, and asks — kindly, and in passing — whether anything is actually different. Nothing about the patient has changed. The position has just become harder to hold, and no new fact has arrived to make it easier.' });
    }
    // The surgical team is busy and takes forty minutes, because what is being asked for is
    // an assessment rather than an emergency, and the lesson should not reward waiting for it.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + THIRD_ATTENDANCE_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The surgical team answers. They read the two previous entries as records of two earlier examinations rather than as conclusions about today, note that this is a third attendance in five days with pain that has moved and stayed, and take ownership of the examination, of any investigation they want, and of whether she is admitted or seen again tomorrow.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded attendances and what each found, what a previous assessment can and cannot say, what has changed since the last visit, and escalation to the team that owns the assessment. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): ThirdAttendanceEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-attendances-and-what-each-found':
        if (this.attendancesAt !== null) return events;
        this.attendancesAt = tick;
        return emit('attendances-recorded', `The attendances are recorded as three separate assessments rather than as one long story: ${this.attendanceNumber()} visits in ${this.daysSinceFirst()} days, the first with generalised abdominal pain and vomiting once, the second recorded as settling with a soft abdomen, and this one. What each visit found is written beside what each visit was, because a record that reads "seen twice and sent home" describes the department and a record of two examinations describes the patient.`);
      case 'record-what-a-previous-assessment-can-say':
        if (this.priorLimitsAt !== null) return events;
        this.priorLimitsAt = tick;
        return emit('prior-limits-recorded', 'What the previous assessments can and cannot say is recorded. Both entries are accurate and neither clinician did anything wrong; each is a record of what was found at that moment by somebody who did not have this one. Their existence lowers the probability of nothing having been looked for, and it does not lower the probability that something is there now. Anchoring on a triage label was associated with a doubling of missed appendicitis in one series, which is a statement about how records are read rather than about how they were written.');
      case 'record-what-has-changed-since-the-last-visit':
        if (this.changeAt !== null) return events;
        this.changeAt = tick;
        return emit('change-recorded', 'What has changed since Tuesday is recorded as a comparison rather than as a snapshot: the pain that was generalised is now consistently in one place and worse when the trolley is knocked, she has not eaten today when on Tuesday she had eaten breakfast, and she has come back a third time having been told not to unless it was worse. What is recorded is the direction of travel between three examinations, because no single one of them contains it.');
      case 'escalate-to-the-surgical-team':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The team that owns the assessment is asked to see her, ${this.colleagueSpoke ? 'and the Tuesday clinician’s recollection is passed on as part of the record rather than argued with' : 'with the three attendances and the change between them stated together'}. The reason given is what is true: a third attendance in five days, pain that has localised and persisted, and two previous assessments that describe two earlier examinations. Nothing here is a criticism of either of them, and the request says so.`);
      case 'record-bounded-assessment-intent':
        if (this.assessmentIntentAt !== null) return events;
        this.assessmentIntentAt = tick;
        return emit('assessment-intent-recorded', 'Bounded intent is recorded and nothing is done: that the qualified team owns the examination, owns any investigation or imaging it wants, owns any decision to operate, and owns whether she is admitted or reviewed again tomorrow. No investigation, score, drug, dose, route, or operation is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, and the second one argues against the instinct this lesson runs on. In an administrative-claims cohort of 101,375 adults with appendicitis, 6.0 percent had a potentially missed diagnosis at an earlier attendance within 30 days, and women had an adjusted odds ratio of 1.68 for abdominal pain compared with men. In a paediatric series, a triage complaint less suggestive of the diagnosis carried 8.8 percent missed against 3.8, an odds ratio of 2.46 — a study of children, quoted for its mechanism rather than its rate. Against both, an analysis of over nine million attendances found that patients discharged and then admitted on a return visit within seven days had lower in-hospital mortality than those admitted first time, 1.85 percent against 2.48, and its authors concluded that return visits do not adequately capture deficits in care. So coming back is common, and it is not by itself evidence that anybody missed anything. The reason to look again is that this is a third examination and nobody has done it yet.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. This partial check supplies no attendance record, and these numbers were very nearly the same on both previous visits.`);
      case 'check-attendance-record':
        this.attendanceRecord = this.attendanceFinding(tick);
        return emit('attendance-record-check', `Requested attendance record: ${this.attendanceRecord.attendances} attendances in ${this.attendanceRecord.daysSinceFirst} days; first visit ${this.attendanceRecord.firstVisitFinding}; second visit ${this.attendanceRecord.secondVisitFinding}; pain now ${this.attendanceRecord.painLocalised ? 'localised to one place' : 'generalised'} and ${this.attendanceRecord.worseOnMovement ? 'worse on movement' : 'unchanged by movement'}; ${this.attendanceRecord.eatingToday ? 'has eaten today' : 'has not eaten today'}; no imaging performed at any visit. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.attendanceRecord = this.attendanceFinding(tick);
        this.observation = { ...this.observationRecord, ...this.attendanceRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.attendances} attendances in ${view.daysSinceFirst} days; pain ${view.painLocalised ? 'localised' : 'generalised'}; ${view.alertness}. ${this.teamResponded ? 'The team has answered, reads the previous entries as earlier examinations rather than as conclusions, and owns the examination, any investigation, and the disposition.' : 'Nothing measured has moved, and nothing measured is going to.'} No diagnosis, cause, treatment effect, or outcome is established here.`);
      }
      case 'she-has-been-seen-twice-already':
        this.seenTwiceAttempted = true;
        return emit('seen-twice-refused', 'Treating two previous assessments as an answer was refused. Two examinations happened; both are recorded accurately, and neither of them examined the abdomen she has today. What the previous visits establish is that somebody looked twice, which is a fact about the department. The question in front of you is a third one, and nobody has answered it yet.');
      case 'the-notes-say-it-was-settling':
        this.settlingClaimAttempted = true;
        return emit('settling-claim-refused', 'Reading "settling" as a trajectory was refused. It is an accurate description of Tuesday, written by somebody comparing Tuesday with Sunday, and the person who wrote it did not have Thursday. Read against the third attendance it describes the middle of a sequence rather than its direction, and a label carried forward without its date is the mechanism by which anchoring works.');
      case 'she-is-anxious-and-keeps-coming-back':
        this.anxiousClaimAttempted = true;
        return emit('anxious-claim-refused', 'Explaining the attendances by the patient was refused. She may well be worried, and being worried is compatible with anything at all; it explains why she came and says nothing about what is there. The phrase also travels: written once it is read by everybody after you as a finding, and it is the sentence that makes a fourth attendance harder for her than this one.');
      case 'discharge-her-with-the-same-advice-again':
        this.sameAdviceAttempted = true;
        return emit('same-advice-refused', 'Sending her home with the same advice was refused. The advice was to come back if it got worse; she has done exactly that, and repeating it turns a safety net into a loop with nobody in it. Going home may still be right and it is not the objection, and disposition belongs to the qualified team; what is refused is issuing the instruction she has already followed as though it were a plan.');
      case 'handoff':
        if (this.attendancesAt === null || this.priorLimitsAt === null || this.changeAt === null
          || this.escalationAt === null || this.assessmentIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the attendances and what each found, record what a previous assessment can and cannot say, record what has changed since the last visit, ask the team that owns the assessment to see her, record bounded qualified-team intent, review the boundaries, and take a current full assessment. A diagnosis, an investigation, and a disposition are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the examination, any investigation, any operation, and the disposition. What travels is the three attendances with what each found, that the earlier entries are records of earlier examinations rather than conclusions about today, the change between them, that no criticism of either previous clinician is intended or recorded, and the bounded intent as theirs, and ${this.teamObserved ? 'that they have read the previous entries the same way and are coming to examine her' : 'that they have been asked and have not yet answered'}. Practice ends, not care, and no diagnosis or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional recording and escalation lesson. No care was started.');
    }
  }

  private attendanceNumber() { return 3; }
  private daysSinceFirst() { return 5; }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 96, systolicMmHg: 118, diastolicMmHg: 70,
      respiratoryRateBpm: 16, spo2Percent: 99, coreTemperatureC: 37.4 };
  }

  private attendanceFinding(tick: number) {
    return { atTick: tick, attendances: this.attendanceNumber(), daysSinceFirst: this.daysSinceFirst(),
      firstVisitFinding: 'generalised abdominal pain, vomited once, discharged',
      secondVisitFinding: 'recorded as settling, soft abdomen, discharged',
      painLocalised: true, worseOnMovement: true, eatingToday: false, imagingPerformed: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Nearly normal, and identical to both previous visits. Nothing here will ever decide
    // this, which is why the comparison between three examinations is the whole lesson.
    return { heartRateBpm: 96, systolicMmHg: 118, diastolicMmHg: 70, meanArterialMmHg: 86,
      respiratoryRateBpm: 16, spo2Percent: 99, coreTemperatureC: 37.4,
      alertness: 'alert, apologetic about being back, and holding herself still on the trolley' };
  }

  snapshot(_tick: number): ThirdAttendanceSnapshot {
    return {
      attendancesRecordedAtTick: this.attendancesAt,
      priorLimitsRecordedAtTick: this.priorLimitsAt,
      changeRecordedAtTick: this.changeAt,
      escalationAtTick: this.escalationAt,
      assessmentIntentAtTick: this.assessmentIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      attendances: this.attendanceNumber(),
      daysSinceFirst: this.daysSinceFirst(),
      // True in every state: nobody has imaged her, and the pain has localised.
      imagingPerformed: false,
      painLocalised: true,
      colleagueSpoke: this.colleagueSpoke,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      seenTwiceAttempted: this.seenTwiceAttempted,
      settlingClaimAttempted: this.settlingClaimAttempted,
      anxiousClaimAttempted: this.anxiousClaimAttempted,
      sameAdviceAttempted: this.sameAdviceAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      attendanceRecord: this.attendanceRecord ? { ...this.attendanceRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
