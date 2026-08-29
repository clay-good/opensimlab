import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { AfferentLimbSnapshot } from '@platform/kernel/protocol';
export type { AfferentLimbSnapshot } from '@platform/kernel/protocol';

/**
 * The clinical inference is already complete and correct before this lesson starts. Every criterion
 * is met and documented. What is being rehearsed is what happens to correct knowledge inside a
 * hierarchy: reviews of missed activation find staff believed the situation was under control in
 * about half of cases, and calling a doctor first was the more common action than calling the team.
 */
export const AFFERENT_LIMB_PRESSURE_TICKS = 15 * 60 * TICKS_PER_SECOND;
export const AFFERENT_LIMB_ARRIVAL_TICKS = 10 * 60 * TICKS_PER_SECOND;
export const AFFERENT_LIMB_TAKEOVER_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const AFFERENT_LIMB_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const AFFERENT_LIMB_ACTIONS = ['record-the-met-criteria', 'record-the-obstacles',
  'call-the-response-team', 'state-the-concern-explicitly', 'review-boundaries', 'monitor',
  'check-criteria', 'check-availability', 'reassess', 'handoff',
  'call-the-doctor-first', 'wait-for-the-ward-round', 'document-and-wait',
  'ask-permission-to-call'] as const;
export type AfferentLimbAction = typeof AFFERENT_LIMB_ACTIONS[number];
export interface AfferentLimbEvent { readonly id: string; readonly message: string }

/** The activation criteria, and whether each is met. Three of five are, which is three too many. */
export const AFFERENT_LIMB_CRITERIA = [
  { id: 'respiratory-rate', label: 'Respiratory rate 30 per minute', met: true },
  { id: 'oxygen-requirement', label: 'New oxygen requirement to hold saturations', met: true },
  { id: 'systolic', label: 'Systolic pressure 88 mmHg', met: true },
  { id: 'consciousness', label: 'New drop in level of consciousness', met: false },
  { id: 'urine-output', label: 'Urine output below threshold for two hours', met: false },
] as const;

export function supportsAfferentLimb(scenario: Scenario): boolean {
  return scenario.metadata.id === 'afferent-limb-a-threshold-met-and-a-call-not-made'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'afferent-limb').length === 1
    && scenario.timeline.filter((event) => event.target === 'afferent-limb-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'afferent-limb-boundary').length === 1;
}

export class AfferentLimb {
  private criteriaRecordedAt: number | null = null;
  private obstaclesRecordedAt: number | null = null;
  private calledAt: number | null = null;
  private concernStatedAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private pressureApplied = false;
  private teamArrived = false;
  private arrivalObserved = false;
  private doctorFirstAttempted = false;
  private roundWaitAttempted = false;
  private documentedOnly = false;
  private permissionSought = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private criteriaRecord: AfferentLimbSnapshot['criteriaRecord'] = null;
  private availabilityRecord: AfferentLimbSnapshot['availabilityRecord'] = null;
  private observation: AfferentLimbSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: AfferentLimbSnapshot['ended'] = null;

  // The patient does not move. What changes is the social pressure and whether the team is here.
  private clinicalState() { return JSON.stringify([this.pressureApplied, this.teamArrived]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): AfferentLimbEvent[] {
    if (this.ended) return [];
    const terminal = this.calledAt === null ? AFFERENT_LIMB_TAKEOVER_TICKS : AFFERENT_LIMB_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: AfferentLimbEvent[] = [];
    if (!this.pressureApplied && this.calledAt === null && until >= AFFERENT_LIMB_PRESSURE_TICKS) {
      this.change(() => { this.pressureApplied = true; });
      events.push({ id: 'pressure-applied', message: 'The charge nurse says it again on her way past: they came yesterday, it was nothing, and they are busy with an arrest on the floor below. Nothing about the patient has changed. Three activation criteria are still met and still documented. The only thing that has grown is the cost of making the call.' });
    }
    // The team comes when called, and only when called. Nothing rescues an uncalled patient here.
    if (!this.teamArrived && this.calledAt !== null
      && until >= this.calledAt + AFFERENT_LIMB_ARRIVAL_TICKS) {
      this.change(() => { this.teamArrived = true; });
      events.push({ id: 'team-arrived', message: 'The response team arrives. They record that the criteria were met on arrival, take over assessment and treatment, and say nothing about yesterday. Whether this call turns out to have been necessary is not something the criteria promised, and is not what made the call correct.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded criteria, the recorded obstacles, and the call made on a met threshold. This authored stop predicts no patient outcome, and it is not evidence that the delay caused harm.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): AfferentLimbEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-met-criteria':
        if (this.criteriaRecordedAt !== null) return events;
        this.criteriaRecordedAt = tick;
        return emit('criteria-recorded', `The activation criteria are recorded as they stand: ${AFFERENT_LIMB_CRITERIA.filter((entry) => entry.met).map((entry) => entry.label.toLowerCase()).join('; ')}. Met, documented, and unambiguous. Recording them is not a preliminary to deciding whether to call; the threshold has already decided that, which is what a threshold is for.`);
      case 'record-the-obstacles':
        if (this.obstaclesRecordedAt !== null) return events;
        this.obstaclesRecordedAt = tick;
        return emit('obstacles-recorded', 'The reasons not to call are recorded plainly, because they are real and naming them is how they stop operating silently: the team attended yesterday and found nothing, they are occupied elsewhere, and the covering doctor is in theatre. None of these is a clinical finding. None of them appears on the criteria. Written down, they can be weighed; unwritten, they simply win.');
      case 'call-the-response-team':
        if (this.calledAt !== null) return events;
        this.calledAt = tick;
        return emit('team-called', `The rapid response team is called directly on the met criteria${this.pressureApplied ? ', after the second conversation and without waiting for it to resolve' : ''}. No permission is sought and none is required: the criteria are the authorisation, which is the entire design of a threshold-triggered system.`);
      case 'state-the-concern-explicitly':
        if (this.calledAt === null) {
          return emit('statement-refused', 'There is nobody to state it to yet. A concern stated into the notes is not a concern stated to a person.');
        }
        if (this.concernStatedAt !== null) return events;
        this.concernStatedAt = tick;
        return emit('concern-stated', 'The concern is stated in words, to the person on the other end: which criteria are met, what has changed since yesterday, and what is being asked for. It is not softened into a question about whether they might have a moment. Reviews of missed activation describe exactly that softening as one of the ways a call stops functioning as an escalation.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. Failure of the afferent limb, meaning the call that was never made or made late, is documented in roughly a fifth to a third of adverse events reviewed. In one systematic review staff believed the situation was under control in about half of missed activations, and calling a physician first rather than the response team was the more frequent action in about three quarters. Delayed escalation appears in a fifth to nearly half of failure-to-rescue cases. These are observational findings about systems rather than a prediction about this patient, and none of them establishes that a given delay causes a given death.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Observation frequency is increased while the team is awaited, and the increase is recorded with its reason. Increased observation is not an alternative to calling; a patient watched more closely by the same person who cannot treat them is still a patient waiting.');
      case 'check-criteria':
        this.criteriaRecord = this.criteriaFinding(tick);
        return emit('criteria-check', `Requested criteria check: ${AFFERENT_LIMB_CRITERIA.map((entry) => `${entry.label}, ${entry.met ? 'met' : 'not met'}`).join('; ')}. ${this.criteriaRecord.metCount} of ${AFFERENT_LIMB_CRITERIA.length} criteria are met, and the local policy requires one. This partial check supplies no information about who is available.`);
      case 'check-availability':
        this.availabilityRecord = this.availabilityFinding(tick);
        return emit('availability-check', `Requested availability: response team ${this.availabilityRecord.responseTeamReachable ? 'reachable on the emergency number' : 'not reachable'}; covering doctor ${this.availabilityRecord.coveringDoctorAvailable ? 'available' : 'in theatre and not contactable'}; charge nurse ${this.availabilityRecord.chargeNurseSupportive ? 'supportive of calling' : 'discouraging the call'}. The response team is reachable regardless of the rest, which is the point of a number that bypasses the hierarchy. This partial check supplies no criteria review.`);
      case 'reassess': {
        this.criteriaRecord = this.criteriaFinding(tick);
        this.availabilityRecord = this.availabilityFinding(tick);
        this.observation = { ...this.criteriaRecord, ...this.availabilityRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamArrived) this.arrivalObserved = true;
        const view = this.observation;
        return emit(this.teamArrived ? 'attended-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: respiratory rate ${view.respiratoryRateBpm}/min; systolic ${view.systolicMmHg} mmHg; oxygen saturation ${view.spo2Percent}% on supplemental oxygen; ${view.alertness}. ${view.metCount} of ${AFFERENT_LIMB_CRITERIA.length} activation criteria met. ${this.teamArrived ? 'The response team is present and has taken over assessment and treatment.' : this.pressureApplied ? 'Nothing about the patient has changed since the criteria were first met.' : 'The criteria were met before this rehearsal began and remain met.'} No diagnosis, cause, or outcome is established here.`);
      }
      case 'call-the-doctor-first':
        this.doctorFirstAttempted = true;
        return emit('doctor-first-refused', 'Calling the covering doctor instead of the response team was refused. It is the documented substitution rather than a safeguard: in one systematic review it was the more frequent first action in about three quarters of missed activations, and here the covering doctor is in theatre. The response team number exists precisely so that a met threshold does not depend on one person being free.');
      case 'wait-for-the-ward-round':
        this.roundWaitAttempted = true;
        return emit('round-refused', 'Waiting for the round was refused. A threshold-triggered system has no waiting state by design: the criteria are met now, and a round that happens later is not a response to a threshold crossed earlier.');
      case 'document-and-wait':
        this.documentedOnly = true;
        return emit('documentation-refused', 'Recording the concern without calling was refused. Documentation is not escalation, and it is the documented failure mode rather than a safeguard: staff believed the situation was under control in about half of missed activations, and a note nobody reads is not a call.');
      case 'ask-permission-to-call':
        this.permissionSought = true;
        return emit('permission-refused', 'Seeking permission to call was refused. The criteria are the authorisation. A threshold that requires someone senior to agree before it can be used is not a threshold, and asking converts a met criterion back into a negotiation, which is the thing the system was built to remove.');
      case 'handoff':
        if (this.criteriaRecordedAt === null || this.obstaclesRecordedAt === null || this.calledAt === null
          || this.concernStatedAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the met criteria, record the obstacles plainly, call the response team on the threshold, state the concern to a person, review the boundaries, increase observation with its reason, and take a current full assessment. A resolved disagreement and a vindicated call are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns assessment, investigation, and every treatment decision. What travels is which criteria were met and when, that the call was made on the threshold rather than on permission, the obstacles recorded as they were, and ${this.arrivalObserved ? 'that the team attended and took over' : 'that the team is still awaited'}. Practice ends, not care, and whether this call proves necessary is not what made it correct.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional escalation lesson. No care was started.');
    }
  }

  private criteriaFinding(tick: number) {
    return { atTick: tick, metCount: AFFERENT_LIMB_CRITERIA.filter((entry) => entry.met).length,
      totalCount: AFFERENT_LIMB_CRITERIA.length, policyThreshold: 1 };
  }

  private availabilityFinding(tick: number) {
    return { atTick: tick, responseTeamReachable: true, coveringDoctorAvailable: false,
      chargeNurseSupportive: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // The patient is fixed. If they deteriorated, the lesson would become about recognition, and
    // the point here is that recognition already happened and correctly.
    return { heartRateBpm: 118, systolicMmHg: 88, diastolicMmHg: 54, meanArterialMmHg: 65,
      respiratoryRateBpm: 30, spo2Percent: 93, coreTemperatureC: 37.8,
      alertness: 'alert, anxious, and speaking in short phrases' };
  }

  snapshot(_tick: number): AfferentLimbSnapshot {
    return {
      criteriaRecordedAtTick: this.criteriaRecordedAt, obstaclesRecordedAtTick: this.obstaclesRecordedAt,
      calledAtTick: this.calledAt, concernStatedAtTick: this.concernStatedAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      metCriteriaCount: AFFERENT_LIMB_CRITERIA.filter((entry) => entry.met).length,
      totalCriteriaCount: AFFERENT_LIMB_CRITERIA.length,
      policyThreshold: 1,
      pressureApplied: this.pressureApplied,
      teamArrived: this.teamArrived,
      arrivalObserved: this.arrivalObserved,
      // Permission was never required. The flag records that it was sought, not that it was granted.
      permissionSought: this.permissionSought,
      doctorFirstAttempted: this.doctorFirstAttempted,
      roundWaitAttempted: this.roundWaitAttempted,
      documentedOnlyAttempted: this.documentedOnly,
      criteriaRecord: this.criteriaRecord ? { ...this.criteriaRecord } : null,
      availabilityRecord: this.availabilityRecord ? { ...this.availabilityRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
