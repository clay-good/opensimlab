import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { TransientResponseSnapshot } from '@platform/kernel/protocol';
export type { TransientResponseSnapshot } from '@platform/kernel/protocol';

/**
 * A pressure that comes back, and comes back less each time.
 *
 * This module's other three lessons hold a monitor still on purpose, so that reading a record
 * is the only thing being tested. This one does the opposite: the numbers move, they move in
 * both directions, and the direction that reassures is the one that is lying. A patient who
 * answers a bolus and then falls again has not been resuscitated; he has been given the
 * interval back, and the interval is the only thing anybody is spending.
 *
 * It is the module's second lesson about not waiting, and deliberately not the same one. In
 * `rising-requirement` the delay is spent waiting for a better number. Here it is spent in a
 * corridor, on the way to a machine that names the bleeding site accurately and cannot stop
 * it. The evidence carried in this lesson disagrees with itself about that on purpose: early
 * whole-body imaging is associated with better survival across polytrauma generally, and the
 * two series about delay are retrospective. Neither of those facts settles the patient in
 * front of you, which is what the boundary review says out loud.
 */
export const TRANSIENT_RESPONSE_FALL_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const TRANSIENT_RESPONSE_TEAM_TICKS = 8 * 60 * TICKS_PER_SECOND;
export const TRANSIENT_RESPONSE_TAKEOVER_TICKS = 45 * 60 * TICKS_PER_SECOND;
export const TRANSIENT_RESPONSE_SESSION_TICKS = 4 * 60 * 60 * TICKS_PER_SECOND;
export const TRANSIENT_RESPONSE_ACTIONS = ['record-the-mechanism-and-the-clock',
  'record-the-shape-of-the-response', 'record-what-a-picture-cannot-do',
  'escalate-to-the-theatre-team', 'record-bounded-operative-intent', 'review-boundaries',
  'check-observations', 'check-response-record', 'reassess', 'handoff',
  'he-came-back-up-so-he-is-stable', 'send-him-for-a-scan-before-calling',
  'give-another-litre-and-see', 'wait-for-the-cross-matched-blood-before-calling'] as const;
export type TransientResponseAction = typeof TRANSIENT_RESPONSE_ACTIONS[number];
export interface TransientResponseEvent { readonly id: string; readonly message: string }

export function supportsTransientResponse(scenario: Scenario): boolean {
  return scenario.metadata.id === 'transient-response-a-patient-who-will-not-stay-up'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'transient-response').length === 1
    && scenario.timeline.filter((event) => event.target === 'transient-response-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'transient-response-boundary').length === 1;
}

export class TransientResponse {
  private mechanismAt: number | null = null;
  private responseAt: number | null = null;
  private imagingLimitsAt: number | null = null;
  private escalationAt: number | null = null;
  private operativeIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private fallen = false;
  private teamResponded = false;
  private teamObserved = false;
  private stabilityClaimAttempted = false;
  private scanFirstAttempted = false;
  private anotherLitreAttempted = false;
  private waitForBloodAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: TransientResponseSnapshot['observationRecord'] = null;
  private responseRecord: TransientResponseSnapshot['responseRecord'] = null;
  private observation: TransientResponseSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: TransientResponseSnapshot['ended'] = null;

  /**
   * Here the monitor really is the thing that moves, so the freshness gate tracks it directly
   * rather than tracking a clock the way this module's other lessons have to.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.minutesSinceInjury(), this.fallen, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): TransientResponseEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? TRANSIENT_RESPONSE_TAKEOVER_TICKS : TRANSIENT_RESPONSE_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: TransientResponseEvent[] = [];
    if (!this.fallen && until >= TRANSIENT_RESPONSE_FALL_TICKS) {
      this.change(() => { this.fallen = true; });
      events.push({ id: 'pressure-fallen-again', message: 'The pressure has fallen a third time, to 84/50 with a rate of 124, and this time it went without anything being taken away. The first bolus held him for twenty minutes and the second for under ten; this fall took five. He is awake, answering, and asking for another blanket. Nothing has been added to the picture except the interval that has passed.' });
    }
    // The theatre team answers faster than anyone in this module, because what is being handed
    // over is a decision that is already made and only needs somebody able to act on it.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + TRANSIENT_RESPONSE_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The on-call surgical team answers and is on its way. They repeat the response pattern back — two boluses, each holding for less time than the one before — state that a patient who will not stay up is a patient who is still bleeding and that naming the site does not change what has to happen to it, and take ownership of the transfer, of any imaging that happens on the way or not at all, and of the operation and its timing.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded mechanism and its clock, the response recorded as a shape rather than a reading, what a picture can and cannot do for this patient, and escalation to the team that can stop the bleeding. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): TransientResponseEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-mechanism-and-the-clock':
        if (this.mechanismAt !== null) return events;
        this.mechanismAt = tick;
        return emit('mechanism-recorded', `The mechanism is recorded with the clock running on it: a restrained driver, front of the car into a barrier at speed, ${this.minutesSinceInjury()} minutes ago, with a tender and distending abdomen and a bedside scan already reported as showing free fluid. The elapsed time is recorded as a live number rather than a detail, because it is the only quantity in this room that nobody can put back.`);
      case 'record-the-shape-of-the-response':
        if (this.responseAt !== null) return events;
        this.responseAt = tick;
        return emit('response-recorded', `The response is recorded as a shape rather than a reading: two warmed boluses, the first taking him up and holding for ${this.firstHeld()} minutes, the second taking him up less far and holding for ${this.secondHeld()}${this.fallen ? ', and a third fall five minutes after that with nothing taken away' : ''}. What is written down is that each answer was smaller and arrived sooner than the last, because a single pressure from the middle of that pattern reads as a patient who is fine.`);
      case 'record-what-a-picture-cannot-do':
        if (this.imagingLimitsAt !== null) return events;
        this.imagingLimitsAt = tick;
        return emit('imaging-limits-recorded', 'What a picture can and cannot do here is recorded, in both directions. Early whole-body imaging is not the enemy: across 4,621 blunt trauma patients in a registry, the 1,494 who received it had a standardised mortality ratio of 0.745 against 1.023 by one scoring system and 0.865 against 1.034 by another, a relative mortality reduction of 25 and 13 percent, with a number needed to scan of 17 or 32. What it cannot do is stop bleeding, and it cannot be done to a patient who will not stay up long enough to lie still in it. The recorded objection is to the interval and to the room, not to the imaging.');
      case 'escalate-to-the-theatre-team':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The team that can stop the bleeding is called now, ${this.fallen ? 'with the third fall and the shrinking intervals stated alongside the clock' : 'with the shape of the response and the clock stated together'}. The reason given is what is true: a mechanism that does this, free fluid already reported, and a pressure that answers and will not hold. Nothing here waits for a picture, a better number, or a bag of blood, because each of those is an interval and the interval is the whole of the harm.`);
      case 'record-bounded-operative-intent':
        if (this.operativeIntentAt !== null) return events;
        this.operativeIntentAt = tick;
        return emit('operative-intent-recorded', 'Bounded intent is recorded and nothing is done: that the qualified team owns the transfer, owns whether any imaging happens on the way or not at all, and owns the operation, its timing, and what is done in it. No drug, dose, route, fluid, blood product, incision, or threshold is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, including the parts that argue with each other. In 243 registry patients hypotensive on arrival with injuries isolated to the abdomen, 98 died, and among the 165 who spent 90 minutes or less in the department the probability of death rose with every minute spent there — as much as 0.35 percent a minute, about 1 percent every 3 minutes. In 309 hypotensive patients with torso gunshot wounds at one centre, reaching the operating room after 10 minutes carried a hazard ratio of 1.89, with a confidence interval of 1.10 to 3.26, and 2.67 with an interval of 0.97 to 7.34 in those at or below 70; read the hazard ratios rather than that paper’s own summary sentence, which describes 1.89 as almost threefold. Against both, whole-body imaging early was associated with better survival across 4,621 blunt trauma patients. All three are retrospective, none is randomised, two are about penetrating or isolated-abdominal injury, and none of them is a permission slip or a stopwatch for the patient in front of you.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on oxygen; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. This partial check supplies no response history, and one reading taken out of a falling pattern is exactly the reading this lesson is about.`);
      case 'check-response-record':
        this.responseRecord = this.responseFinding(tick);
        return emit('response-record-check', `Requested response record: ${this.responseRecord.mechanism}, ${this.responseRecord.minutesSinceInjury} minutes ago; ${this.responseRecord.bolusCount} warmed boluses given before this assessment; the first answer held ${this.responseRecord.firstResponseHeldMinutes} minutes and the second ${this.responseRecord.secondResponseHeldMinutes}; free fluid ${this.responseRecord.freeFluidReported ? 'reported on the bedside scan' : 'not reported'}. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.responseRecord = this.responseFinding(tick);
        this.observation = { ...this.observationRecord, ...this.responseRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.minutesSinceInjury} minutes since injury; ${view.bolusCount} boluses, holding ${view.firstResponseHeldMinutes} minutes and then ${view.secondResponseHeldMinutes}; ${view.alertness}. ${this.teamResponded ? 'The team has answered and owns the transfer, any imaging on the way or not at all, and the operation and its timing.' : 'The pattern has not settled and nobody able to stop it has been told.'} No diagnosis, injury, treatment effect, or outcome is established here.`);
      }
      case 'he-came-back-up-so-he-is-stable':
        this.stabilityClaimAttempted = true;
        return emit('stability-claim-refused', 'Reading the return as stability was refused. A pressure that answers a bolus tells you the circulation can still be filled, which is a statement about the volume you added and not about the hole it is running out of. Stability is a pressure that holds without being propped up, and his has now been propped up twice and held for less each time; that is the finding, and it is pointing the other way.');
      case 'send-him-for-a-scan-before-calling':
        this.scanFirstAttempted = true;
        return emit('scan-first-refused', 'Sending him for a picture before telling anybody was refused. The scan is worth having in general and it is the receiving team’s to arrange or to skip, not a gate to be cleared before the call. For this patient it names a site that free fluid has already made likely, cannot stop what it names, and is a room he has to stay up in — and the studies about delay measure the harm in single minutes.');
      case 'give-another-litre-and-see':
        this.anotherLitreAttempted = true;
        return emit('another-litre-refused', 'Another bolus and a wait was refused. The first two are the reason he is still talking, and nobody is objecting to the ones already given; what is refused is spending a third interval to watch the same answer get smaller. Volume is not control of bleeding, prescribing and blood products are the qualified team’s, and the pattern that a third bolus would produce is already recorded.');
      case 'wait-for-the-cross-matched-blood-before-calling':
        this.waitForBloodAttempted = true;
        return emit('wait-for-blood-refused', 'Waiting for cross-matched blood before calling anyone was refused. The blood matters and it is the team’s to arrange, and it can be arranged at the same time as the call rather than in front of it. Nothing about the request to the operating team has to wait for a laboratory, and an interval spent in sequence is an interval spent.');
      case 'handoff':
        if (this.mechanismAt === null || this.responseAt === null || this.imagingLimitsAt === null
          || this.escalationAt === null || this.operativeIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the mechanism and its clock, record the response as a shape rather than a reading, record what a picture can and cannot do for this patient, call the team that can stop the bleeding, record bounded qualified-team intent, review the boundaries, and take a current full assessment. A named injury, a completed scan, and cross-matched blood are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the transfer, any imaging on the way or not at all, and the operation and its timing. What travels is the mechanism with the minutes on it, the response recorded as a shrinking pattern rather than a reading, what a picture can and cannot do here, that the team was called without waiting for one, and the bounded intent as theirs, and ${this.teamObserved ? 'that they repeated the pattern back and are on their way' : 'that they have been called and have not yet answered'}. Practice ends, not care, and no injury, effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional recording and escalation lesson. No care was started.');
    }
  }

  private minutesSinceInjury() { return this.fallen ? 45 : 40; }
  private firstHeld() { return 20; }
  private secondHeld() { return 9; }

  private observationFinding(tick: number) {
    const vitals = this.vitals();
    return { atTick: tick, heartRateBpm: vitals.heartRateBpm, systolicMmHg: vitals.systolicMmHg,
      diastolicMmHg: vitals.diastolicMmHg, respiratoryRateBpm: vitals.respiratoryRateBpm,
      spo2Percent: vitals.spo2Percent, coreTemperatureC: vitals.coreTemperatureC };
  }

  private responseFinding(tick: number) {
    return { atTick: tick, mechanism: 'restrained driver, front of the car into a barrier at speed',
      minutesSinceInjury: this.minutesSinceInjury(), bolusCount: 2,
      firstResponseHeldMinutes: this.firstHeld(), secondResponseHeldMinutes: this.secondHeld(),
      freeFluidReported: true };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // These move, and that is the difference between this lesson and the other three in the
    // module. They move in the reassuring direction first, which is the difficulty.
    return this.fallen
      ? { heartRateBpm: 124, systolicMmHg: 84, diastolicMmHg: 50, meanArterialMmHg: 61,
        respiratoryRateBpm: 26, spo2Percent: 96, coreTemperatureC: 35.6,
        alertness: 'awake and answering, harder to keep with you, and asking for another blanket' }
      : { heartRateBpm: 112, systolicMmHg: 96, diastolicMmHg: 58, meanArterialMmHg: 71,
        respiratoryRateBpm: 24, spo2Percent: 97, coreTemperatureC: 35.8,
        alertness: 'awake and answering, apologising for shivering, and drifting down again since the last bolus' };
  }

  snapshot(_tick: number): TransientResponseSnapshot {
    return {
      mechanismRecordedAtTick: this.mechanismAt,
      responseRecordedAtTick: this.responseAt,
      imagingLimitsRecordedAtTick: this.imagingLimitsAt,
      escalationAtTick: this.escalationAt,
      operativeIntentAtTick: this.operativeIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      minutesSinceInjury: this.minutesSinceInjury(),
      bolusCount: 2,
      firstResponseHeldMinutes: this.firstHeld(),
      secondResponseHeldMinutes: this.secondHeld(),
      // Reported before the learner arrived, and true in every state: it makes a site likely
      // and settles nothing about what has to be done to it.
      freeFluidReported: true,
      fallen: this.fallen,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      stabilityClaimAttempted: this.stabilityClaimAttempted,
      scanFirstAttempted: this.scanFirstAttempted,
      anotherLitreAttempted: this.anotherLitreAttempted,
      waitForBloodAttempted: this.waitForBloodAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      responseRecord: this.responseRecord ? { ...this.responseRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
