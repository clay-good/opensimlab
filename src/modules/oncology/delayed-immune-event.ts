import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { DelayedImmuneEventSnapshot } from '@platform/kernel/protocol';
export type { DelayedImmuneEventSnapshot } from '@platform/kernel/protocol';

/**
 * A drug that stopped months ago is still the most important thing in the history. This lesson
 * exists because every surface the clinician actually reads — the current medication list, the
 * referral letter, the problem list — has already dropped the exposure, and the presentation it
 * explains looks exactly like something ordinary. Nothing here is hidden. It is simply no longer
 * written down anywhere that gets read first.
 */
export const DELAYED_IMMUNE_EVENT_COURSE_TICKS = 45 * 60 * TICKS_PER_SECOND;
export const DELAYED_IMMUNE_EVENT_SERVICE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const DELAYED_IMMUNE_EVENT_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const DELAYED_IMMUNE_EVENT_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const DELAYED_IMMUNE_EVENT_ACTIONS = ['record-the-completed-exposure',
  'record-the-symptom-course', 'record-infection-evaluation-in-parallel',
  'escalate-to-the-treating-service', 'record-bounded-treatment-intent', 'review-boundaries',
  'check-observations', 'check-exposure-history', 'reassess', 'handoff',
  'stopped-months-ago-so-not-the-drug', 'slow-the-gut-and-review-tomorrow',
  'wait-for-stool-results-before-escalating', 'discharge-with-oral-rehydration'] as const;
export type DelayedImmuneEventAction = typeof DELAYED_IMMUNE_EVENT_ACTIONS[number];
export interface DelayedImmuneEventEvent { readonly id: string; readonly message: string }

export function supportsDelayedImmuneEvent(scenario: Scenario): boolean {
  return scenario.metadata.id === 'delayed-immune-event-a-drug-that-stopped-months-ago'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'delayed-immune-event').length === 1
    && scenario.timeline.filter((event) => event.target === 'delayed-immune-event-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'delayed-immune-event-boundary').length === 1;
}

export class DelayedImmuneEvent {
  private exposureAt: number | null = null;
  private courseAt: number | null = null;
  private infectionEvaluationAt: number | null = null;
  private escalationAt: number | null = null;
  private treatmentIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private courseProgressed = false;
  private serviceResponded = false;
  private serviceObserved = false;
  private attributionRefused = false;
  private motilityAttempted = false;
  private waitAttempted = false;
  private dischargeAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: DelayedImmuneEventSnapshot['observationRecord'] = null;
  private exposureRecord: DelayedImmuneEventSnapshot['exposureRecord'] = null;
  private observation: DelayedImmuneEventSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: DelayedImmuneEventSnapshot['ended'] = null;

  /**
   * The observations barely move in this lesson, so a freshness gate built on vitals alone would
   * be inert. What changes is the stool count, whether the treating service has answered, and
   * whether the course has declared itself — so that is what the gate tracks.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.stoolsToday(), this.courseProgressed, this.serviceResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): DelayedImmuneEventEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? DELAYED_IMMUNE_EVENT_TAKEOVER_TICKS : DELAYED_IMMUNE_EVENT_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: DelayedImmuneEventEvent[] = [];
    if (!this.courseProgressed && until >= DELAYED_IMMUNE_EVENT_COURSE_TICKS) {
      this.change(() => { this.courseProgressed = true; });
      events.push({ id: 'course-progressed', message: 'Another loose stool, the eighth counted today, with cramping across the lower abdomen that settles between episodes. The observations have barely moved. Nothing here declares itself, which is the ordinary way this presents.' });
    }
    // The treating service answers only if it was called. Nobody arrives on their own, because
    // the failure this lesson teaches is that the exposure never reached the people who own it.
    if (!this.serviceResponded && this.escalationAt !== null
      && until >= this.escalationAt + DELAYED_IMMUNE_EVENT_SERVICE_TICKS) {
      this.change(() => { this.serviceResponded = true; });
      events.push({ id: 'service-responded', message: 'The treating oncology service answers. They confirm the four cycles and the last dose 22 weeks ago from their own records, state that this presentation is within the pattern they investigate as immune-mediated, and take ownership of grading, further investigation, and every treatment decision. They also record that the interval since the last dose does not exclude it.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded exposure, the symptom course, infection evaluation carried alongside rather than ahead, and escalation to the service that gave the drug. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): DelayedImmuneEventEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-completed-exposure':
        if (this.exposureAt !== null) return events;
        this.exposureAt = tick;
        return emit('exposure-recorded', 'The completed exposure is recorded as current history rather than past history: four cycles of an anti-PD-1 checkpoint inhibitor in the adjuvant setting, last dose 22 weeks ago, now in surveillance. It is absent from the current medication list because it stopped, and absent from the referral letter for the same reason. A drug that finished is still an exposure.');
      case 'record-the-symptom-course':
        if (this.courseAt !== null) return events;
        this.courseAt = tick;
        return emit('course-recorded', 'The course is recorded as described: three weeks of increasing stool frequency, now seven above this patient’s own baseline in a day, with cramping abdominal pain and no blood reported. What is recorded is frequency above baseline and duration, because a count without a baseline and a course without a start date support nothing.');
      case 'record-infection-evaluation-in-parallel':
        if (this.infectionEvaluationAt !== null) return events;
        this.infectionEvaluationAt = tick;
        return emit('infection-evaluation-recorded', 'Infection evaluation is recorded as running alongside, not ahead. Published guidance is that diagnostic evaluation should attempt to rule out other causes — stool infectious analysis including Clostridioides difficile and, where suspicion warrants, cytomegalovirus — while treatment for an immune-related event is initiated as clinically appropriate rather than deferred until those results return. The two are concurrent by design.');
      case 'escalate-to-the-treating-service':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The service that gave the drug is contacted, ${this.courseProgressed ? 'with the exposure, the three-week course and the eighth stool today stated together' : 'with the exposure and the three-week course stated together'}. The reason given is what is actually true: a completed checkpoint-inhibitor exposure, a compatible new gastrointestinal course, and no alternative cause established. This is not asking permission to treat; it is returning the problem to the people holding the record of the drug.`);
      case 'record-bounded-treatment-intent':
        if (this.treatmentIntentAt !== null) return events;
        this.treatmentIntentAt = tick;
        return emit('treatment-intent-recorded', 'Bounded intent is recorded and nothing is administered: that the qualified team may grade this presentation and consider corticosteroid treatment, that severity grading governs whether and when that begins, and that further investigation including endoscopy is theirs to select. No drug, dose, route, or threshold is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. Immune-related events can begin during treatment or after it has stopped, including beyond six to twelve months. The series that named delayed events collected 23 cases, with a median off-treatment interval of six months and a median cumulative exposure of four doses — a case series, not an incidence, and it cannot tell you how often this happens or how likely it is here. Its authors’ point is the diagnostic one: misattribution leads to unnecessary or harmful interventions. Colitis is not a footnote among these events; in a pharmacovigilance analysis it caused 135 of 193 reported anti-CTLA-4 fatalities, while colitis itself carried a reported fatality of about 2 to 5 percent. This patient received an anti-PD-1 drug, where the fatal spectrum was different, so that figure describes a class rather than this case.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C; ${this.observationRecord.stoolsToday} stools counted today. This partial check supplies no history and no exposure record.`);
      case 'check-exposure-history':
        this.exposureRecord = this.exposureFinding(tick);
        return emit('exposure-check', `Requested history: ${this.exposureRecord.checkpointInhibitorCycles} cycles of an anti-PD-1 checkpoint inhibitor completed, last dose ${this.exposureRecord.weeksSinceLastDose} weeks ago; ${this.exposureRecord.onCurrentMedicationList ? 'present on the current medication list' : 'absent from the current medication list, because it stopped'}; ${this.exposureRecord.referralAttribution}. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.exposureRecord = this.exposureFinding(tick);
        this.observation = { ...this.observationRecord, ...this.exposureRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.serviceResponded) this.serviceObserved = true;
        const view = this.observation;
        return emit(this.serviceResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on air; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.stoolsToday} stools today; ${view.alertness}. ${this.serviceResponded ? 'The treating service has answered and owns grading, investigation, and treatment; the interval since the last dose does not exclude an immune-related cause.' : 'The observations are unremarkable and the course has not turned around.'} No diagnosis, grade, treatment effect, or outcome is established here.`);
      }
      case 'stopped-months-ago-so-not-the-drug':
        this.attributionRefused = true;
        return emit('attribution-refused', 'Excluding the drug because it stopped was refused. Immune-related events can occur at any point during treatment or after it has ceased, including beyond six to twelve months; in the collected series the median interval from the last dose was six months, after a median of four doses. An interval is not a defence, and the drug being off the list is a property of the list.');
      case 'slow-the-gut-and-review-tomorrow':
        this.motilityAttempted = true;
        return emit('motility-refused', 'Slowing the gut and reviewing tomorrow was refused. The mechanism under suspicion is inflammation of the bowel wall, so a symptom count that improves without the inflammation improving removes the only sign being followed, and complications of colitis include perforation and toxic megacolon. Choosing a symptomatic agent is in any case a treatment decision that belongs to the qualified team, and this lesson exposes no drug.');
      case 'wait-for-stool-results-before-escalating':
        this.waitAttempted = true;
        return emit('wait-refused', 'Waiting for the stool results before calling anyone was refused. Guidance runs the infectious evaluation alongside rather than ahead: other causes should be sought while treatment for an immune-related event is initiated as clinically appropriate. A negative result would not have changed who needs to be told, and a positive one would not have excluded the second process.');
      case 'discharge-with-oral-rehydration':
        this.dischargeAttempted = true;
        return emit('discharge-refused', 'Discharge with oral fluids and safety-netting was refused. Nothing has been established, nobody holding the treatment record has been told, and the safety net offered would depend on this patient re-presenting with the same history that has already failed to be heard twice. Disposition is not this learner’s to set.');
      case 'handoff':
        if (this.exposureAt === null || this.courseAt === null || this.infectionEvaluationAt === null
          || this.escalationAt === null || this.treatmentIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the completed exposure as current history, record the symptom course against its baseline, record infection evaluation as running alongside, contact the treating service, record bounded qualified-team treatment intent, review the boundaries, and take a current full assessment. A confirmed grade, a negative stool result, and an endoscopy are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns grading, investigation, treatment, and disposition. What travels is the completed exposure with its interval, the symptom course against this patient’s baseline, that infection evaluation is running alongside rather than ahead, that the treating service was contacted, the bounded treatment intent as the qualified team’s decision, and ${this.serviceObserved ? 'that the service confirmed the exposure from its own records and that the interval does not exclude an immune-related cause' : 'that the service has been contacted and has not yet answered'}. Practice ends, not care, and no diagnosis, grade, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional delayed immune-event lesson. No care was started.');
    }
  }

  private stoolsToday() { return this.courseProgressed ? 8 : 7; }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 104, systolicMmHg: 106, diastolicMmHg: 64,
      respiratoryRateBpm: 18, spo2Percent: 98, coreTemperatureC: 36.8,
      stoolsToday: this.stoolsToday() };
  }

  private exposureFinding(tick: number) {
    return { atTick: tick, checkpointInhibitorCycles: 4, weeksSinceLastDose: 22,
      onCurrentMedicationList: false,
      referralAttribution: 'the referral letter names infectious gastroenteritis and does not mention the immunotherapy' };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Deliberately unremarkable. If these deteriorated, the lesson would collapse into an
    // ordinary sepsis drill and stop teaching the attribution that is the whole point.
    return { heartRateBpm: 104, systolicMmHg: 106, diastolicMmHg: 64, meanArterialMmHg: 78,
      respiratoryRateBpm: 18, spo2Percent: 98, coreTemperatureC: 36.8,
      alertness: 'alert, orientated, and tired of being told this is a stomach bug' };
  }

  snapshot(_tick: number): DelayedImmuneEventSnapshot {
    return {
      exposureRecordedAtTick: this.exposureAt, courseRecordedAtTick: this.courseAt,
      infectionEvaluationAtTick: this.infectionEvaluationAt, escalationAtTick: this.escalationAt,
      treatmentIntentAtTick: this.treatmentIntentAt, boundariesReviewedAtTick: this.boundariesAt,
      weeksSinceLastDose: 22, checkpointInhibitorCycles: 4,
      // The exposure is absent from every list that gets read first, in every state of this
      // scenario. That is the lesson, and it is reported as a fact rather than as a trap.
      absentFromCurrentMedicationList: true,
      stoolsToday: this.stoolsToday(),
      courseProgressed: this.courseProgressed,
      serviceResponded: this.serviceResponded,
      serviceObserved: this.serviceObserved,
      attributionExclusionAttempted: this.attributionRefused,
      motilityAttempted: this.motilityAttempted,
      waitForResultsAttempted: this.waitAttempted,
      dischargeAttempted: this.dischargeAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      exposureRecord: this.exposureRecord ? { ...this.exposureRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
