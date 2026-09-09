import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { UnownedDelaySnapshot } from '@platform/kernel/protocol';
export type { UnownedDelaySnapshot } from '@platform/kernel/protocol';

/**
 * A wait that nobody decided.
 *
 * Nobody in this case is arguing that she should not have her hip fixed. Two days have gone
 * anyway, in fragments: an echocardiogram requested for a murmur nobody has documented, a
 * medical review that was never asked of a named person, and a list that was full on a day
 * nobody rebooked her from. Each fragment had a reason at the time and none of them has an
 * author, so there is nobody for whom the delay is currently a problem.
 *
 * It is the module's third lesson about not waiting, and deliberately a third mechanism. In
 * `rising-requirement` the interval goes on waiting for a better number; in
 * `transient-response` it goes in a corridor on the way to a machine. Here it goes into a
 * queue, and the only thing that moves is the clock. The evidence carried here disagrees with
 * itself harder than in any other lesson in the module: two large observational bodies find
 * delay associated with death, and the randomised trial of going faster found nothing. Both
 * of those are true, and neither of them licenses a wait that nobody has signed.
 */
export const UNOWNED_DELAY_LIST_TICKS = 10 * 60 * TICKS_PER_SECOND;
export const UNOWNED_DELAY_TEAM_TICKS = 12 * 60 * TICKS_PER_SECOND;
export const UNOWNED_DELAY_TAKEOVER_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const UNOWNED_DELAY_SESSION_TICKS = 6 * 60 * 60 * TICKS_PER_SECOND;
export const UNOWNED_DELAY_ACTIONS = ['record-the-fracture-and-the-clock',
  'record-what-each-delay-was-for', 'record-what-is-still-being-waited-for',
  'escalate-to-the-team-that-owns-the-list', 'record-bounded-scheduling-intent', 'review-boundaries',
  'check-observations', 'check-delay-record', 'reassess', 'handoff',
  'she-is-not-fit-until-the-echo-is-done', 'the-list-is-full-so-it-is-out-of-our-hands',
  'one-more-night-will-not-make-a-difference', 'keep-her-fasted-in-case-a-slot-appears'] as const;
export type UnownedDelayAction = typeof UNOWNED_DELAY_ACTIONS[number];
export interface UnownedDelayEvent { readonly id: string; readonly message: string }

export function supportsUnownedDelay(scenario: Scenario): boolean {
  return scenario.metadata.id === 'unowned-delay-a-wait-that-nobody-decided'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'unowned-delay').length === 1
    && scenario.timeline.filter((event) => event.target === 'unowned-delay-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'unowned-delay-boundary').length === 1;
}

export class UnownedDelay {
  private fractureAt: number | null = null;
  private reasonsAt: number | null = null;
  private pendingAt: number | null = null;
  private escalationAt: number | null = null;
  private schedulingIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private listLost = false;
  private teamResponded = false;
  private teamObserved = false;
  private echoGateAttempted = false;
  private listFullAttempted = false;
  private oneMoreNightAttempted = false;
  private keepFastedAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: UnownedDelaySnapshot['observationRecord'] = null;
  private delayRecord: UnownedDelaySnapshot['delayRecord'] = null;
  private observation: UnownedDelaySnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: UnownedDelaySnapshot['ended'] = null;

  /**
   * Nothing on the monitor moves here either, but unlike this module's holding lessons the
   * quantity that does move is the one the whole case is about, so the freshness gate tracks
   * the hours and the cancellations rather than a physiological state.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.hoursSinceAdmission(), this.listLost, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): UnownedDelayEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? UNOWNED_DELAY_TAKEOVER_TICKS : UNOWNED_DELAY_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: UnownedDelayEvent[] = [];
    if (!this.listLost && until >= UNOWNED_DELAY_LIST_TICKS) {
      this.change(() => { this.listLost = true; });
      events.push({ id: 'list-lost', message: 'The emergency theatre has taken another case and this evening is gone, which makes tomorrow the third day and this the third cancellation. She has now been fasted for nineteen hours of the last two days for operations that did not happen. Her pulse, her pressure and her saturation are exactly what they were on admission; the only number in this case that has moved is the one on the clock.' });
    }
    // The team that owns the list answers quickly once somebody actually asks it, which is the
    // uncomfortable part: the delay was never anybody refusing.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + UNOWNED_DELAY_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The team that owns the list answers, and quickly. They had not known she was still waiting. They take the fracture, the hours and the cancellations, put her name against a named slot with a named consultant, state that the echocardiogram request was never theirs and is not a gate they recognise, and take ownership of the scheduling, of any preoperative investigation they do want, and of the fasting instruction that follows from the slot.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded fracture and its clock, what each delay was for, what is still actually being waited for, and escalation to the team that owns the list. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): UnownedDelayEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-fracture-and-the-clock':
        if (this.fractureAt !== null) return events;
        this.fractureAt = tick;
        return emit('fracture-recorded', `The fracture is recorded with the clock running on it: a displaced femoral neck fracture in an 84-year-old after a fall at home, admitted ${this.hoursSinceAdmission()} hours ago, ${this.cancellations()} cancellations, ${this.fastedHours()} hours fasted across those days, and nobody at any point arguing that she should not have the operation. The elapsed hours are recorded as a live number rather than an administrative detail, because they are the only thing in this case that is changing.`);
      case 'record-what-each-delay-was-for':
        if (this.reasonsAt !== null) return events;
        this.reasonsAt = tick;
        return emit('delay-reasons-recorded', 'Each delay is recorded with what it was for and who asked, and the gaps are recorded as gaps. An echocardiogram was requested for a murmur that appears in no examination entry, by nobody the record names. A medical review was awaited, of no named person, with no question attached. A list was full on a day from which nobody rebooked her. Every one of those had a reason at the moment it happened, and not one of them has an author, which is why the total has never been anybody’s problem.');
      case 'record-what-is-still-being-waited-for':
        if (this.pendingAt !== null) return events;
        this.pendingAt = tick;
        return emit('pending-recorded', `What is still actually being waited for is recorded, separately from what is merely still written down. The echocardiogram is not booked and no one has said what would change if it were done. No medical question is outstanding in the notes. What remains is a slot. That distinction is recorded explicitly, because a delay described as clinical and a delay that is organisational are fixed by two different telephone calls, and ${this.hoursSinceAdmission()} hours have gone into the wrong one.`);
      case 'escalate-to-the-team-that-owns-the-list':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The team that owns the list is called and asked to own the wait, ${this.listLost ? 'with three cancellations, nineteen fasted hours and the clock stated together' : 'with the cancellations and the clock stated together'}. What is asked for is a named slot with a named person, not a general escalation of concern. The reason given is what is true: an operation everybody agrees she needs, a delay nobody decided, and no clinical question left to answer.`);
      case 'record-bounded-scheduling-intent':
        if (this.schedulingIntentAt !== null) return events;
        this.schedulingIntentAt = tick;
        return emit('scheduling-intent-recorded', 'Bounded intent is recorded and nothing is arranged: that the qualified team owns the scheduling and the order of the list, owns whether any preoperative investigation is actually wanted, owns the anaesthetic assessment, and owns the fasting instruction that follows from the slot they give. No operation, time, technique, drug, dose, route, or investigation is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, and they disagree more sharply here than anywhere else in this module. In 42,230 hip fracture patients in a population cohort, the risk of complications rose once the wait passed 24 hours, and 13,731 propensity-matched patients operated after that point had 30-day mortality of 6.5 percent against 5.8, an absolute risk difference of 0.79 percent, with the composite outcome 12.2 against 10.1. A meta-analysis of sixteen observational studies, 13,478 patients with complete mortality data, put the adjusted relative risk of death with earlier surgery at 0.81. Against both, a randomised trial of 2,970 patients that moved the median time to surgery from 24 hours to 6 found no significant difference in mortality at 90 days, 9 against 10 percent, hazard ratio 0.91, or in major complications. The honest reading is that accelerating an already prompt pathway has not been shown to help, and that none of it describes a patient in her third day with no clinical question outstanding.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. This partial check supplies no delay record, and these numbers are the same numbers as on admission — which is exactly why nobody has noticed the two days.`);
      case 'check-delay-record':
        this.delayRecord = this.delayFinding(tick);
        return emit('delay-record-check', `Requested delay record: ${this.delayRecord.injury}, admitted ${this.delayRecord.hoursSinceAdmission} hours ago; ${this.delayRecord.cancellations} cancellations; ${this.delayRecord.fastedHours} hours fasted; echocardiogram ${this.delayRecord.echoRequested ? 'requested' : 'not requested'} and ${this.delayRecord.echoBooked ? 'booked' : 'not booked'}; requesting clinician ${this.delayRecord.echoRequesterNamed ? 'named' : 'not named in the record'}; outstanding medical question ${this.delayRecord.medicalQuestionOutstanding ? 'documented' : 'none documented'}. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.delayRecord = this.delayFinding(tick);
        this.observation = { ...this.observationRecord, ...this.delayRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; oxygen saturation ${view.spo2Percent}%; ${view.hoursSinceAdmission} hours since admission; ${view.cancellations} cancellations; ${view.fastedHours} hours fasted; ${view.alertness}. ${this.teamResponded ? 'The list team has answered, has her against a named slot with a named consultant, does not recognise the echocardiogram as a gate, and owns the scheduling and the fasting instruction.' : 'Nothing measured has moved, and nobody currently owns the wait.'} No diagnosis, complication, treatment effect, or outcome is established here.`);
      }
      case 'she-is-not-fit-until-the-echo-is-done':
        this.echoGateAttempted = true;
        return emit('echo-gate-refused', 'Treating the echocardiogram as a fitness gate was refused. It was requested for a murmur that appears in no examination entry, by nobody the record names, and nobody has written down what finding would change what is done. An investigation whose result has no stated consequence is not a gate; it is a delay with a clinical-sounding label, and deciding what preoperative testing is actually wanted belongs to the teams who will do the operation and the anaesthetic.');
      case 'the-list-is-full-so-it-is-out-of-our-hands':
        this.listFullAttempted = true;
        return emit('list-full-refused', 'Recording the full list as the end of the matter was refused. A full list is a fact and it is somebody’s: it is prioritised by a named person who can be told that a patient is in her third day with no clinical question outstanding, and who cannot weigh what they have not been told. The refusal is not to the constraint, which is real; it is to filing a wait under nobody.');
      case 'one-more-night-will-not-make-a-difference':
        this.oneMoreNightAttempted = true;
        return emit('one-more-night-refused', 'One more night as a reason was refused. It may well be true for this patient and it cannot be the reason, because it is the sentence that produced the first two nights and will produce the fourth; nobody who says it is holding the total. What is recorded instead is the total itself, so that the next person to decide is deciding about 48 hours rather than about tonight.');
      case 'keep-her-fasted-in-case-a-slot-appears':
        this.keepFastedAttempted = true;
        return emit('keep-fasted-refused', 'Keeping her fasted against a slot that does not exist was refused. Nineteen hours of fasting have already been spent on operations that did not happen, and fasting on speculation is a cost paid by the patient to preserve somebody else’s option. The fasting instruction properly follows a named slot and belongs to the teams giving the anaesthetic; no fasting rule, duration, or fluid is selected here.');
      case 'handoff':
        if (this.fractureAt === null || this.reasonsAt === null || this.pendingAt === null
          || this.escalationAt === null || this.schedulingIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the fracture and its clock, record what each delay was for and who asked, record what is still actually being waited for, call the team that owns the list and ask it to own the wait, record bounded qualified-team intent, review the boundaries, and take a current full assessment. A completed echocardiogram, a confirmed slot, and a theatre time are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the scheduling, any preoperative investigation it actually wants, the anaesthetic assessment, and the fasting instruction. What travels is the fracture with the hours on it, each delay with what it was for and who asked, the separation of what is still clinically outstanding from what is merely still written down, that the wait was given an owner, and the bounded intent as theirs, and ${this.teamObserved ? 'that they have her against a named slot with a named consultant and do not recognise the echocardiogram as a gate' : 'that they have been called and have not yet answered'}. Practice ends, not care, and no operation, effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional recording and escalation lesson. No care was started.');
    }
  }

  private hoursSinceAdmission() { return this.listLost ? 48 : 42; }
  private cancellations() { return this.listLost ? 3 : 2; }
  private fastedHours() { return this.listLost ? 19 : 13; }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 92, systolicMmHg: 132, diastolicMmHg: 70,
      respiratoryRateBpm: 18, spo2Percent: 95, coreTemperatureC: 36.4 };
  }

  private delayFinding(tick: number) {
    return { atTick: tick, injury: 'displaced femoral neck fracture after a fall at home',
      hoursSinceAdmission: this.hoursSinceAdmission(), cancellations: this.cancellations(),
      fastedHours: this.fastedHours(), echoRequested: true, echoBooked: false,
      echoRequesterNamed: false, medicalQuestionOutstanding: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Unchanged from admission and unchanging, which is the reason two days went unnoticed:
    // there was never a number on this chart for anybody to react to.
    return { heartRateBpm: 92, systolicMmHg: 132, diastolicMmHg: 70, meanArterialMmHg: 91,
      respiratoryRateBpm: 18, spo2Percent: 95, coreTemperatureC: 36.4,
      alertness: 'awake, in pain when the leg is moved, tired of being told not to eat, and asking when it will be done' };
  }

  snapshot(_tick: number): UnownedDelaySnapshot {
    return {
      fractureRecordedAtTick: this.fractureAt,
      delayReasonsRecordedAtTick: this.reasonsAt,
      pendingRecordedAtTick: this.pendingAt,
      escalationAtTick: this.escalationAt,
      schedulingIntentAtTick: this.schedulingIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      hoursSinceAdmission: this.hoursSinceAdmission(),
      cancellations: this.cancellations(),
      fastedHours: this.fastedHours(),
      // True in every state: requested, never booked, and nobody's.
      echoRequested: true,
      echoBooked: false,
      echoRequesterNamed: false,
      medicalQuestionOutstanding: false,
      listLost: this.listLost,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      echoGateAttempted: this.echoGateAttempted,
      listFullAttempted: this.listFullAttempted,
      oneMoreNightAttempted: this.oneMoreNightAttempted,
      keepFastedAttempted: this.keepFastedAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      delayRecord: this.delayRecord ? { ...this.delayRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
