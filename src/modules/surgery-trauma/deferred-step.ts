import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { DeferredStepSnapshot } from '@platform/kernel/protocol';
export type { DeferredStepSnapshot } from '@platform/kernel/protocol';

/**
 * A decision attached to a person rather than to a clock.
 *
 * Nobody has refused anything. The board says orthopaedics will review her and give the
 * antibiotics then, which is a completely ordinary sentence, and it quietly converts a step
 * with a therapeutic window into a step that happens whenever somebody walks in. The registrar
 * is in theatre. The window is measured from the injury, and the injury was 47 minutes ago.
 *
 * It is the module's fourth lesson about not waiting, and its fourth mechanism. In
 * `rising-requirement` the interval goes on waiting for a better number; in
 * `transient-response` on a room; in `unowned-delay` into a queue nobody owns. Here the delay
 * has an owner and a plan, and the plan is the problem: the step was tied to an arrival.
 */
// The slip must precede the reply: the team here answers faster than anyone in the module,
// and if it answered first the lesson would never show what an attached step does when the
// person it is attached to becomes unavailable.
export const DEFERRED_STEP_SLIP_TICKS = 4 * 60 * TICKS_PER_SECOND;
export const DEFERRED_STEP_TEAM_TICKS = 6 * 60 * TICKS_PER_SECOND;
export const DEFERRED_STEP_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const DEFERRED_STEP_SESSION_TICKS = 3 * 60 * 60 * TICKS_PER_SECOND;
export const DEFERRED_STEP_ACTIONS = ['record-the-injury-and-the-clock',
  'record-the-step-that-is-waiting', 'record-what-the-interval-is-attached-to',
  'escalate-to-the-team-that-can-prescribe', 'record-bounded-prescribing-intent', 'review-boundaries',
  'check-observations', 'check-wound-record', 'reassess', 'handoff',
  'orthopaedics-will-give-them-when-they-review-her', 'she-is-stable-so-there-is-no-hurry',
  'it-can-go-on-the-morning-drug-chart', 'wait-until-she-is-in-theatre-anyway'] as const;
export type DeferredStepAction = typeof DEFERRED_STEP_ACTIONS[number];
export interface DeferredStepEvent { readonly id: string; readonly message: string }

export function supportsDeferredStep(scenario: Scenario): boolean {
  return scenario.metadata.id === 'deferred-step-a-decision-attached-to-a-person'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'deferred-step').length === 1
    && scenario.timeline.filter((event) => event.target === 'deferred-step-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'deferred-step-boundary').length === 1;
}

export class DeferredStep {
  private injuryAt: number | null = null;
  private pendingStepAt: number | null = null;
  private attachmentAt: number | null = null;
  private escalationAt: number | null = null;
  private prescribingIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private reviewSlipped = false;
  private teamResponded = false;
  private teamObserved = false;
  private reviewGateAttempted = false;
  private noHurryAttempted = false;
  private morningChartAttempted = false;
  private theatreAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: DeferredStepSnapshot['observationRecord'] = null;
  private woundRecord: DeferredStepSnapshot['woundRecord'] = null;
  private observation: DeferredStepSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: DeferredStepSnapshot['ended'] = null;

  /**
   * The patient is entirely stable and stays that way, so the gate tracks the two things that
   * move: the minutes since injury, and how far the promised review has slipped.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.minutesSinceInjury(), this.reviewSlipped, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): DeferredStepEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? DEFERRED_STEP_TAKEOVER_TICKS : DEFERRED_STEP_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: DeferredStepEvent[] = [];
    if (!this.reviewSlipped && until >= DEFERRED_STEP_SLIP_TICKS) {
      this.change(() => { this.reviewSlipped = true; });
      events.push({ id: 'review-slipped', message: 'Theatre rings: the registrar’s current case has become more complicated and the review will not happen before half past five. Nothing about the patient has changed — she is comfortable, the foot is warm, the pulses are there — and the step that was attached to that review has just moved with it. It is now 55 minutes since the injury.' });
    }
    // Whoever is asked says yes almost at once, because what is being asked for is a decision
    // somebody can make on the telephone rather than a visit.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + DEFERRED_STEP_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The team that can prescribe answers within minutes and does not need to see her first. They confirm the injury and the time of it from the record, state that the step does not have to wait for their review and that they will decide the agent and the dose now, and take ownership of the prescription, of the wound dressing and photography, and of the debridement and its timing.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded injury and its clock, the step that is waiting, what the interval was attached to, and escalation to the team that can decide it now. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): DeferredStepEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-injury-and-the-clock':
        if (this.injuryAt !== null) return events;
        this.injuryAt = tick;
        return emit('injury-recorded', `The injury is recorded with the clock running on it: an open tibial fracture in a 34-year-old thrown from a motorcycle, bone visible through a six-centimetre wound contaminated with road grit, ${this.minutesSinceInjury()} minutes ago, foot warm with palpable pulses and normal sensation. The minutes are recorded from the injury rather than from arrival, because that is the clock the published thresholds are measured against and the two differ by nineteen minutes here.`);
      case 'record-the-step-that-is-waiting':
        if (this.pendingStepAt !== null) return events;
        this.pendingStepAt = tick;
        return emit('pending-step-recorded', 'The step that is waiting is recorded plainly: she has had no antibiotic. Nobody has decided against one, no allergy is documented, no contraindication is recorded, and no disagreement exists anywhere in the notes. It is written down as an outstanding step rather than as part of a plan, because a step nobody objects to and nobody has taken is invisible until somebody names it.');
      case 'record-what-the-interval-is-attached-to':
        if (this.attachmentAt !== null) return events;
        this.attachmentAt = tick;
        return emit('attachment-recorded', `What the interval is attached to is recorded, and it is the whole finding. The board says orthopaedics will review her and give the antibiotics then, which ties a step with a therapeutic window measured in minutes to the moment a particular person becomes free${this.reviewSlipped ? ', and that person is now not free until half past five' : ', and that person is in theatre'}. The step has an owner and a plan; the plan attaches it to an arrival rather than to a clock, and nobody in the sentence is doing anything wrong.`);
      case 'escalate-to-the-team-that-can-prescribe':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The team that can make the decision is called now and asked to make it without seeing her, ${this.reviewSlipped ? 'with the slipped review and the minutes since injury stated together' : 'with the minutes since injury stated first'}. What is asked for is a decision rather than a visit: the injury, the time of it, the absence of any documented allergy or contraindication, and the question of whether this has to wait for the review. Nothing here waits for the ward round, because the review is not what the window is measured from.`);
      case 'record-bounded-prescribing-intent':
        if (this.prescribingIntentAt !== null) return events;
        this.prescribingIntentAt = tick;
        return emit('prescribing-intent-recorded', 'Bounded intent is recorded and nothing is chosen: that the qualified team owns whether an antibiotic is given, which one, at what dose and by what route, owns the wound dressing and any photography, and owns the debridement and its timing. No agent, dose, route, interval, or dressing is selected here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, and the two modern series disagree about both the threshold and the clock. In 137 type III open tibial fractures, antibiotics beyond 66 minutes from injury independently predicted deep infection at 90 days with an odds ratio of 3.78 and a confidence interval of 1.16 to 12.31, and immediate antibiotics with early coverage gave 1 infection in 36 against 17 in 42 when both were delayed. In 230 consecutive open fractures at another centre, administration beyond 120 minutes from arrival in the emergency department carried a 2.4-fold hazard of surgical site infection, while the underlying difference in median time between those who did and did not become infected was 61 against 83 minutes and did not reach significance at p equals 0.053. An older series of 1,104 open fracture wounds with 77 infections named early antibiotics as the single most important factor without a threshold at all. Two thresholds, two different starting points, and both retrospective: there is no stopwatch here. What survives all three is that the interval is not free, which is a reason not to attach it to somebody’s arrival.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. This partial check supplies no wound record, and every one of these numbers is normal — which is the reason nobody is hurrying.`);
      case 'check-wound-record':
        this.woundRecord = this.woundFinding(tick);
        return emit('wound-record-check', `Requested wound record: ${this.woundRecord.injury}, ${this.woundRecord.minutesSinceInjury} minutes since injury and ${this.woundRecord.minutesSinceArrival} since arrival; wound ${this.woundRecord.woundLengthCm} cm with bone visible and ${this.woundRecord.contaminated ? 'visible contamination' : 'no visible contamination'}; ${this.woundRecord.pulsesPresent ? 'pulses palpable and sensation normal' : 'pulses not felt'}; antibiotic ${this.woundRecord.antibioticGiven ? 'given' : 'not given'}; documented allergy ${this.woundRecord.allergyDocumented ? 'present' : 'none'}; anybody objecting ${this.woundRecord.objectionRecorded ? 'yes' : 'nobody'}. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.woundRecord = this.woundFinding(tick);
        this.observation = { ...this.observationRecord, ...this.woundRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.minutesSinceInjury} minutes since injury; antibiotic ${view.antibioticGiven ? 'given' : 'still not given'}; ${view.alertness}. ${this.teamResponded ? 'The team has answered, does not need to see her first, and owns the prescription, the dressing and photography, and the debridement and its timing.' : 'Nothing measured has moved, and the step is still attached to a review that has not happened.'} No diagnosis, infection, treatment effect, or outcome is established here.`);
      }
      case 'orthopaedics-will-give-them-when-they-review-her':
        this.reviewGateAttempted = true;
        return emit('review-gate-refused', 'Leaving the step attached to the review was refused. The review is worth having and it is theirs to do; what is refused is treating their arrival as the moment the step becomes possible, when the decision needs a telephone call rather than a pair of eyes. Nothing about the wound will be clearer at half past five than it is now, and the clock the published thresholds use started at the injury rather than at the ward round.');
      case 'she-is-stable-so-there-is-no-hurry':
        this.noHurryAttempted = true;
        return emit('no-hurry-refused', 'Reading her stability as time in hand was refused. She is entirely stable and will stay that way through this whole rehearsal; the outcome the interval is being spent against is a deep infection at ninety days, which no observation tonight measures and nothing on this chart will announce. A normal set of observations is the reason this delay is comfortable, not evidence that it is safe.');
      case 'it-can-go-on-the-morning-drug-chart':
        this.morningChartAttempted = true;
        return emit('morning-chart-refused', 'Deferring it to the morning chart was refused. Writing it down for later converts an outstanding step into a completed piece of administration, which is the exact move that makes it stop being anybody’s problem. Prescribing is the qualified team’s and no chart is written here; what is refused is recording the step as handled when what has happened is that it has been scheduled behind everything else.');
      case 'wait-until-she-is-in-theatre-anyway':
        this.theatreAttempted = true;
        return emit('theatre-refused', 'Waiting for theatre was refused. She may well go tonight and the operation is the qualified team’s to time; the step being discussed is not part of the operation and does not need the operating room, the anaesthetic, or the debridement to happen. Attaching it to theatre is the same error as attaching it to the review, with a longer interval on it.');
      case 'handoff':
        if (this.injuryAt === null || this.pendingStepAt === null || this.attachmentAt === null
          || this.escalationAt === null || this.prescribingIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the injury and its clock, record the step that is waiting, record what the interval is attached to, call the team that can decide it without seeing her, record bounded qualified-team intent, review the boundaries, and take a current full assessment. A completed review, a written chart, and a theatre slot are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the prescription and everything in it, the dressing and photography, and the debridement and its timing. What travels is the injury with the minutes measured from it, the step recorded as outstanding rather than planned, what the interval had been attached to, that the decision was asked for without a visit, and the bounded intent as theirs, and ${this.teamObserved ? 'that they answered without needing to see her and have taken the decision on' : 'that they have been called and have not yet answered'}. Practice ends, not care, and no infection, effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional recording and escalation lesson. No care was started.');
    }
  }

  private minutesSinceInjury() { return this.reviewSlipped ? 55 : 47; }
  private minutesSinceArrival() { return this.reviewSlipped ? 36 : 28; }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 88, systolicMmHg: 124, diastolicMmHg: 74,
      respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.7 };
  }

  private woundFinding(tick: number) {
    return { atTick: tick, injury: 'open tibial fracture after being thrown from a motorcycle',
      minutesSinceInjury: this.minutesSinceInjury(), minutesSinceArrival: this.minutesSinceArrival(),
      woundLengthCm: 6, contaminated: true, pulsesPresent: true,
      antibioticGiven: false, allergyDocumented: false, objectionRecorded: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Entirely normal and they stay normal. Her being well is precisely what makes the
    // deferral feel reasonable to everybody involved.
    return { heartRateBpm: 88, systolicMmHg: 124, diastolicMmHg: 74, meanArterialMmHg: 91,
      respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.7,
      alertness: 'alert, uncomfortable but coping, and asking how long it will be' };
  }

  snapshot(_tick: number): DeferredStepSnapshot {
    return {
      injuryRecordedAtTick: this.injuryAt,
      pendingStepRecordedAtTick: this.pendingStepAt,
      attachmentRecordedAtTick: this.attachmentAt,
      escalationAtTick: this.escalationAt,
      prescribingIntentAtTick: this.prescribingIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      minutesSinceInjury: this.minutesSinceInjury(),
      minutesSinceArrival: this.minutesSinceArrival(),
      // True in every state: nothing has been given, nobody has objected, and nothing is wrong
      // with the limb itself.
      antibioticGiven: false,
      objectionRecorded: false,
      pulsesPresent: true,
      reviewSlipped: this.reviewSlipped,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      reviewGateAttempted: this.reviewGateAttempted,
      noHurryAttempted: this.noHurryAttempted,
      morningChartAttempted: this.morningChartAttempted,
      theatreAttempted: this.theatreAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      woundRecord: this.woundRecord ? { ...this.woundRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
