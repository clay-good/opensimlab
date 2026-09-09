import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RisingRequirementSnapshot } from '@platform/kernel/protocol';
export type { RisingRequirementSnapshot } from '@platform/kernel/protocol';

/**
 * A number that under-calls and a number that over-calls.
 *
 * Both slogans about this diagnosis are wrong in opposite directions. "It is a clinical
 * diagnosis" runs into clinical findings with a sensitivity of 13 to 19 percent, which miss
 * most cases. "Check the pressure" runs into 53 of 116 patients recording an absolute
 * compartment pressure over 30 mmHg while three of them had the syndrome. What tracked was
 * neither: it was the differential against diastolic, measured continuously, over time.
 *
 * So this lesson is the module's counterweight. Its first lesson teaches a learner to hold a
 * position while nothing changes; this one teaches that a requirement rising over hours is
 * itself the finding, and that here the harm is measured in the delay.
 */
export const RISING_REQUIREMENT_WORSENING_TICKS = 10 * 60 * TICKS_PER_SECOND;
export const RISING_REQUIREMENT_TEAM_TICKS = 20 * 60 * TICKS_PER_SECOND;
export const RISING_REQUIREMENT_TAKEOVER_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const RISING_REQUIREMENT_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const RISING_REQUIREMENT_ACTIONS = ['record-the-injury-and-the-clock',
  'record-the-rising-requirement', 'record-what-one-pressure-cannot-decide',
  'escalate-to-the-surgical-team', 'record-bounded-decompression-intent', 'review-boundaries',
  'check-observations', 'check-limb-record', 'reassess', 'handoff',
  'pulses-are-present-so-perfusion-is-fine', 'the-pressure-was-below-the-threshold',
  'increase-analgesia-and-review-in-the-morning', 'wait-for-a-repeat-pressure-before-calling'] as const;
export type RisingRequirementAction = typeof RISING_REQUIREMENT_ACTIONS[number];
export interface RisingRequirementEvent { readonly id: string; readonly message: string }

export function supportsRisingRequirement(scenario: Scenario): boolean {
  return scenario.metadata.id === 'rising-requirement-a-number-that-under-calls'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'rising-requirement').length === 1
    && scenario.timeline.filter((event) => event.target === 'rising-requirement-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'rising-requirement-boundary').length === 1;
}

export class RisingRequirement {
  private injuryAt: number | null = null;
  private requirementAt: number | null = null;
  private pressureLimitsAt: number | null = null;
  private escalationAt: number | null = null;
  private decompressionIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private worsened = false;
  private teamResponded = false;
  private teamObserved = false;
  private perfusionClaimAttempted = false;
  private thresholdClaimAttempted = false;
  private analgesiaAttempted = false;
  private repeatPressureAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: RisingRequirementSnapshot['observationRecord'] = null;
  private limbRecord: RisingRequirementSnapshot['limbRecord'] = null;
  private observation: RisingRequirementSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RisingRequirementSnapshot['ended'] = null;

  /**
   * Unlike this module's first lesson, something here really is moving — but it is moving in
   * the requirement and the hours since injury, not in the observations a monitor shows. That
   * is what the freshness gate tracks.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.hoursSinceInjury(), this.worsened, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): RisingRequirementEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? RISING_REQUIREMENT_TAKEOVER_TICKS : RISING_REQUIREMENT_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: RisingRequirementEvent[] = [];
    if (!this.worsened && until >= RISING_REQUIREMENT_WORSENING_TICKS) {
      this.change(() => { this.worsened = true; });
      events.push({ id: 'requirement-risen-again', message: 'He has asked for something more for the pain again, the fourth request in as many hours, and passive extension of the toes now stops him mid-sentence. The foot is warm, the dorsalis pedis is easily felt, capillary refill is under two seconds, and he can feel you touching the first web space. Nothing a monitor shows has changed.' });
    }
    // The surgical team answers only if it was called, and faster than in this module's first
    // lesson, because what is being escalated is time-critical rather than uncertain.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + RISING_REQUIREMENT_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The on-call orthopaedic team answers. They confirm the fracture and the time of injury from their own record, state that a single pressure reading neither establishes nor excludes this and that the finding they act on is the trend, and take ownership of repeat assessment, of any further measurement, and of the decision to decompress.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded injury and its clock, the rising requirement recorded as a trajectory, what one pressure reading cannot decide, and escalation to the team that owns the decision. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RisingRequirementEvent[] {
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
        return emit('injury-recorded', `The injury is recorded with the clock running on it: a closed tibial diaphyseal fracture, ${this.hoursSinceInjury()} hours ago, immobilised in a below-knee cast. The time since injury is recorded as a live number rather than a detail, because every decision after this one is about how long a compartment has already been under pressure.`);
      case 'record-the-rising-requirement':
        if (this.requirementAt !== null) return events;
        this.requirementAt = tick;
        return emit('requirement-recorded', `The requirement is recorded as a trajectory rather than a complaint: three escalating requests for analgesia across ${this.hoursSinceInjury()} hours, each sooner than the last, with pain on passive extension of the toes. What is recorded is the direction and the interval, because a patient in pain after a fracture is unremarkable and a patient needing more every hour is not.`);
      case 'record-what-one-pressure-cannot-decide':
        if (this.pressureLimitsAt !== null) return events;
        this.pressureLimitsAt = tick;
        return emit('pressure-limits-recorded', 'What the single reading can and cannot do is recorded. In 116 monitored tibial fractures, 53 recorded an absolute compartment pressure above 30 mmHg in the first twelve hours and 30 were above 40, while three patients had the syndrome — so an absolute number over-calls badly. What tracked was the differential against diastolic pressure, measured continuously: only one patient in that first period fell below 30 mmHg of differential, and he was decompressed. One reading, taken once, is neither of those things.');
      case 'escalate-to-the-surgical-team':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The team that owns the decision is called now, ${this.worsened ? 'with the fourth request and the pain on passive stretch stated alongside the clock' : 'with the rising requirement and the clock stated together'}. The reason given is what is true: an at-risk limb, a requirement climbing over hours, and an investigation that cannot settle it either way. Nothing here waits for a better number, because the cost of being slow is the whole of the harm.`);
      case 'record-bounded-decompression-intent':
        if (this.decompressionIntentAt !== null) return events;
        this.decompressionIntentAt = tick;
        return emit('decompression-intent-recorded', 'Bounded intent is recorded and nothing is done: that the qualified team may repeat the assessment, may measure continuously rather than once, and may decide to decompress, and that the decision to operate is theirs. No drug, dose, route, threshold, incision, or dressing is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. The slogan that this is a clinical diagnosis meets a review of four eligible studies in which clinical findings carried a sensitivity of 13 to 19 percent and a positive predictive value of 11 to 15 percent: present, they establish little; absent, they are worth more, with specificity and negative predictive value of 97 to 98 percent. One finding put the probability near 25 percent and three put it at 93. Against that, continuous differential monitoring in 850 tibial fractures gave a sensitivity of 94 percent and a specificity of 98, with 141 of 152 fasciotomies confirmed and five cases missed. All of it is tibial-fracture data from single centres, and none of it is a licence to wait for a number.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. This partial check supplies no limb record and no requirement history, and none of these numbers is abnormal.`);
      case 'check-limb-record':
        this.limbRecord = this.limbFinding(tick);
        return emit('limb-check', `Requested limb record: ${this.limbRecord.injury}, ${this.limbRecord.hoursSinceInjury} hours ago, ${this.limbRecord.immobilised ? 'in a below-knee cast' : 'not immobilised'}; ${this.limbRecord.analgesiaRequests} escalating analgesia requests; pain on passive extension ${this.limbRecord.painOnPassiveStretch ? 'present' : 'absent'}; ${this.limbRecord.pulsePresent ? 'dorsalis pedis easily felt' : 'no pulse felt'}; a single compartment pressure of ${this.limbRecord.singlePressureMmHg} mmHg recorded once. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.limbRecord = this.limbFinding(tick);
        this.observation = { ...this.observationRecord, ...this.limbRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.hoursSinceInjury} hours since injury; ${view.analgesiaRequests} escalating requests; ${view.pulsePresent ? 'pulse present' : 'no pulse'}; ${view.alertness}. ${this.teamResponded ? 'The team has answered and owns repeat assessment, further measurement, and the decision to decompress; the finding they act on is the trend rather than one reading.' : 'The observations remain normal and the requirement has not settled.'} No diagnosis, compartment syndrome, treatment effect, or outcome is established here.`);
      }
      case 'pulses-are-present-so-perfusion-is-fine':
        this.perfusionClaimAttempted = true;
        return emit('perfusion-claim-refused', 'Reasoning from the pulse to the compartment was refused. A palpable dorsalis pedis, a warm foot and normal capillary refill are findings about the artery, and the pressure that closes a compartment is far below the pressure that closes that vessel. Their presence is compatible with the diagnosis rather than evidence against it, which is why they are recorded but not relied on.');
      case 'the-pressure-was-below-the-threshold':
        this.thresholdClaimAttempted = true;
        return emit('threshold-claim-refused', 'Excluding this because one reading sat below a remembered cut-off was refused. In the monitored series, 53 of 116 patients exceeded an absolute 30 mmHg and 30 exceeded 40 while three had the syndrome, so the absolute number is not the quantity that discriminates; the differential against diastolic, followed over time, is. A single reading is not a differential and not a trend.');
      case 'increase-analgesia-and-review-in-the-morning':
        this.analgesiaAttempted = true;
        return emit('analgesia-refused', 'Increasing the analgesia and reviewing in the morning was refused. The requirement is the finding being followed, so raising it removes the only signal anyone is watching while the clock that decides the outcome keeps running. Comfort is not the objection; deferring the decision until morning is, and prescribing is in any case the qualified team’s.');
      case 'wait-for-a-repeat-pressure-before-calling':
        this.repeatPressureAttempted = true;
        return emit('repeat-pressure-refused', 'Waiting for a repeat pressure before calling anyone was refused. The measurement is worth having and it is the team’s to arrange, not a gate to be cleared before telling them. A second isolated reading would still not be the differential trend that discriminates, and the interval spent obtaining it is the harm this lesson is about.');
      case 'handoff':
        if (this.injuryAt === null || this.requirementAt === null || this.pressureLimitsAt === null
          || this.escalationAt === null || this.decompressionIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the injury and its clock, record the rising requirement as a trajectory, record what one pressure reading cannot decide, call the team that owns the decision, record bounded qualified-team intent, review the boundaries, and take a current full assessment. A confirmed diagnosis, a repeat pressure, and a decision about theatre are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns repeat assessment, further measurement, and the decision to decompress. What travels is the injury with the hours on it, the requirement recorded as a rising trajectory, what one reading cannot decide, that the team was called without waiting for a better number, and the bounded intent as theirs, and ${this.teamObserved ? 'that they confirmed the fracture and its timing from their own record and act on the trend rather than one measurement' : 'that they have been called and have not yet answered'}. Practice ends, not care, and no diagnosis or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional limb-assessment lesson. No care was started.');
    }
  }

  private hoursSinceInjury() { return this.worsened ? 9 : 8; }
  private analgesiaRequests() { return this.worsened ? 4 : 3; }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 96, systolicMmHg: 128, diastolicMmHg: 74,
      respiratoryRateBpm: 18, spo2Percent: 99, coreTemperatureC: 36.9 };
  }

  private limbFinding(tick: number) {
    return { atTick: tick, injury: 'closed tibial diaphyseal fracture',
      hoursSinceInjury: this.hoursSinceInjury(), immobilised: true,
      analgesiaRequests: this.analgesiaRequests(), painOnPassiveStretch: true,
      pulsePresent: true, singlePressureMmHg: 34 };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Entirely normal, and they stay normal. Nothing a monitor shows will ever make this
    // decision, which is the difference between this lesson and a resuscitation.
    return { heartRateBpm: 96, systolicMmHg: 128, diastolicMmHg: 74, meanArterialMmHg: 92,
      respiratoryRateBpm: 18, spo2Percent: 99, coreTemperatureC: 36.9,
      alertness: 'alert, apologetic about asking again, and distracted by the leg' };
  }

  snapshot(_tick: number): RisingRequirementSnapshot {
    return {
      injuryRecordedAtTick: this.injuryAt,
      requirementRecordedAtTick: this.requirementAt,
      pressureLimitsRecordedAtTick: this.pressureLimitsAt,
      escalationAtTick: this.escalationAt,
      decompressionIntentAtTick: this.decompressionIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      hoursSinceInjury: this.hoursSinceInjury(),
      analgesiaRequests: this.analgesiaRequests(),
      singlePressureMmHg: 34,
      // True in every state: the artery is fine and says nothing about the compartment.
      pulsePresent: true,
      painOnPassiveStretch: true,
      worsened: this.worsened,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      perfusionClaimAttempted: this.perfusionClaimAttempted,
      thresholdClaimAttempted: this.thresholdClaimAttempted,
      analgesiaAttempted: this.analgesiaAttempted,
      repeatPressureAttempted: this.repeatPressureAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      limbRecord: this.limbRecord ? { ...this.limbRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
