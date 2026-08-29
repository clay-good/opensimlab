import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LostContingencySnapshot } from '@platform/kernel/protocol';
export type { LostContingencySnapshot } from '@platform/kernel/protocol';

/**
 * The record is complete. Nothing is missing from the chart, nothing was charted wrongly, and the
 * patient is not deteriorating. What went missing went missing in the two minutes somebody spent
 * describing her, and the only evidence that it went missing is that the person who received the
 * handoff cannot repeat it back. A plan that exists and was not transmitted is, at three in the
 * morning, indistinguishable from a plan that does not exist.
 */
export const LOST_CONTINGENCY_OUTPUT_TICKS = 12 * 60 * TICKS_PER_SECOND;
export const LOST_CONTINGENCY_CONFIRMATION_TICKS = 18 * 60 * TICKS_PER_SECOND;
export const LOST_CONTINGENCY_TAKEOVER_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const LOST_CONTINGENCY_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const LOST_CONTINGENCY_ACTIONS = ['record-what-was-said', 'check-the-notes',
  'record-the-gap-as-a-transmission-gap', 'reconstruct-the-contingency',
  'record-what-the-gap-changes', 'confirm-the-plan-with-the-team', 'review-boundaries',
  'monitor', 'reassess', 'handoff',
  'nothing-said-means-nothing-applies', 'ask-the-day-nurse-to-remember',
  'a-quiet-handover-means-a-stable-patient', 'write-a-plan-of-my-own'] as const;
export type LostContingencyAction = typeof LOST_CONTINGENCY_ACTIONS[number];
export interface LostContingencyEvent { readonly id: string; readonly message: string }

/** What was said, and what the notes hold. The difference is one line, and it is the lesson. */
export const LOST_CONTINGENCY_SPOKEN = ['illness severity, given as stable',
  'patient summary, day two after emergency laparotomy',
  'action list: four-hourly observations, drain care, and the morning bloods'] as const;
export const LOST_CONTINGENCY_RECORDED = ['illness severity, given as stable',
  'patient summary, day two after emergency laparotomy',
  'action list: four-hourly observations, drain care, and the morning bloods',
  'contingency: if the hourly urine output stays below 34 millilitres for two consecutive hours, or if the drain output becomes blood-stained, call the surgical registrar directly overnight rather than waiting for the morning round'] as const;

const URINE_THRESHOLD_ML = 34;
const URINE_HOURLY_ML = 35;

export function supportsLostContingency(scenario: Scenario): boolean {
  return scenario.metadata.id === 'lost-contingency-a-plan-that-was-not-said'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'lost-contingency').length === 1
    && scenario.timeline.filter((event) => event.target === 'lost-contingency-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'lost-contingency-boundary').length === 1;
}

export class LostContingency {
  private spokenRecordedAt: number | null = null;
  private notesCheckedAt: number | null = null;
  private gapRecordedAt: number | null = null;
  private reconstructedAt: number | null = null;
  private consequencesRecordedAt: number | null = null;
  private confirmationAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private outputReported = false;
  private confirmationArrived = false;
  private confirmationObserved = false;
  private nothingSaidReadAsNothingApplies = false;
  private memoryAskedFor = false;
  private quietReadAsStable = false;
  private ownPlanAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private spokenRecord: LostContingencySnapshot['spokenRecord'] = null;
  private notesRecord: LostContingencySnapshot['notesRecord'] = null;
  private observation: LostContingencySnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: LostContingencySnapshot['ended'] = null;

  // The reconstruction belongs here with the two authored transitions: it changes what a
  // reassessment reports, so an assessment taken before it must not stay fresh.
  private clinicalState() {
    return JSON.stringify([this.outputReported, this.confirmationArrived, this.reconstructedAt !== null]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): LostContingencyEvent[] {
    if (this.ended) return [];
    const terminal = this.confirmationAt === null ? LOST_CONTINGENCY_TAKEOVER_TICKS : LOST_CONTINGENCY_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: LostContingencyEvent[] = [];
    if (!this.outputReported && until >= LOST_CONTINGENCY_OUTPUT_TICKS) {
      this.change(() => { this.outputReported = true; });
      events.push({ id: 'output-reported', message: `The healthcare assistant reports the last hour's urine output: ${URINE_HOURLY_ML} millilitres. That is above the threshold in the written plan, and one hour is not two, so nothing is triggered and nothing needs to be done about it. What it does is make the plan matter: the next measurement is now a number with a meaning attached, and it has that meaning only for someone who knows the plan exists.` });
    }
    // The team confirms the plan when it is taken to them, and not otherwise.
    if (!this.confirmationArrived && this.confirmationAt !== null
      && until >= this.confirmationAt + LOST_CONTINGENCY_CONFIRMATION_TICKS) {
      this.change(() => { this.confirmationArrived = true; });
      events.push({ id: 'confirmation-arrived', message: 'The surgical registrar confirms the plan stands as written, unchanged, and records that it was confirmed overnight. Nothing about it was altered. What changed is that two people now hold it instead of one, and it is written where the next shift will find it without having to go looking.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review what was said, what the notes hold, and the one line that exists in the second and not the first. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): LostContingencyEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-what-was-said':
        this.spokenRecordedAt ??= tick;
        this.spokenRecord = { atTick: tick, spokenElements: [...LOST_CONTINGENCY_SPOKEN], contingencyWasSpoken: false };
        return emit('spoken-recorded', `Recorded what was actually said, before it fades: ${LOST_CONTINGENCY_SPOKEN.join('; ')}. Written down within the minute rather than remembered, because the only evidence that something was not said is an accurate account of what was, and that account has a shelf life of about five minutes. This partial record reads no notes.`);
      case 'check-the-notes':
        this.notesCheckedAt ??= tick;
        this.notesRecord = { atTick: tick, recordedElements: [...LOST_CONTINGENCY_RECORDED],
          contingencyInTheRecord: true, urineThresholdMl: URINE_THRESHOLD_ML };
        return emit('notes-check', `Requested notes: the post-operative review holds ${LOST_CONTINGENCY_RECORDED.length} elements, one more than was said. The extra one is a contingency, written yesterday by the surgical team: ${LOST_CONTINGENCY_RECORDED[3]}. The record is complete and correct. Nothing here was charted wrongly. This partial check supplies no account of the handover.`);
      case 'record-the-gap-as-a-transmission-gap':
        if (this.spokenRecordedAt === null || this.notesCheckedAt === null) {
          return emit('gap-refused', 'A gap between what was said and what is written is a claim about both, and only one of them has been read. Record the spoken handover and read the notes before recording that they differ.');
        }
        if (this.gapRecordedAt !== null) return events;
        this.gapRecordedAt = tick;
        return emit('gap-recorded', 'Recorded, and recorded as what it is: the contingency is in the notes and was not in the handover. This is a transmission gap, not a documentation gap and not a clinical error. Nobody failed to write it down, nobody wrote it down wrongly, and the patient is exactly as she was described. What failed is the two minutes in which one person described her to another, and that failure leaves no trace anywhere except in a receiver who cannot repeat the plan back.');
      case 'reconstruct-the-contingency':
        if (this.gapRecordedAt === null) {
          return emit('reconstruct-refused', 'Nothing has been recorded as missing yet. Reconstructing before the gap is recorded produces a plan with no account of where it came from, which is the same problem one step later.');
        }
        if (this.reconstructedAt !== null) return events;
        this.change(() => { this.reconstructedAt = tick; });
        return emit('reconstructed', `Reconstructed from the notes, in the surgical team's words and not in yours: ${LOST_CONTINGENCY_RECORDED[3]}. Every part of it was recoverable, because the record was never the thing that failed. This is transcription with attribution, not authorship: the trigger, the threshold, the action, and the owner are all theirs.`);
      case 'record-what-the-gap-changes':
        if (this.reconstructedAt === null) {
          return emit('consequences-refused', 'There is no reconstructed plan yet, so there is nothing whose consequences can be stated.');
        }
        if (this.consequencesRecordedAt !== null) return events;
        this.consequencesRecordedAt = tick;
        return emit('consequences-recorded', 'Recorded: what the gap changed was not the plan and not the patient. It changed who knew, and for how long. Between the handover and this moment the plan existed in the notes and in nobody on this shift, and a plan nobody on shift holds is a plan that gets acted on only if somebody happens to go and read for it at the moment it becomes relevant. It was recoverable here because it was looked for before it was needed, and that ordering is the whole of what went right.');
      case 'confirm-the-plan-with-the-team':
        if (this.reconstructedAt === null) {
          return emit('confirmation-refused', 'There is nothing to confirm yet. A confirmation request carries the reconstructed plan and asks whether it still stands; without it the call is a request for a new plan, which is a different call, made for a different reason, at three in the morning.');
        }
        if (this.confirmationAt !== null) return events;
        this.confirmationAt = tick;
        return emit('confirmation-requested', 'The reconstructed plan is taken to the surgical registrar to confirm it still stands as written. This is not asking permission to follow it and not asking for a new one. A plan recovered from the notes by one person overnight is worth one confirmation from the team that wrote it, which costs a minute and puts it back in more than one head.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, and one of them is about who was studied. Contingency planning is among the elements observers most often find absent from spoken handovers: in one audiotape study of 503 sign-outs, anticipatory guidance came at a rate of about half a statement per patient, in a median handover of thirty-five seconds each; in a simulation study the situation-awareness element was absent from 54 percent of sign-outs; and direct observation across thirty-two hospitals found verbal contingency plans present in 29 percent before a structured programme and 78 percent after. Information also degrades as it is passed on: in that same audiotape study, 22 percent of second sign-outs omitted or mischaracterised something from the first, and the published example of it is this exact failure, a plan to call the team on a defined trigger becoming, one handover later, that there is nothing to do tonight. A systematic review grades the evidence that structured handoff reduces errors and adverse events as moderate certainty, and the strongest single trial, a cluster-randomised one, found compliance rose while the rate of preventable adverse events did not move; across the wider literature, mortality was examined in four studies and improved in none. What no study has done is isolate a lost contingency as a cause of harm, so this is a well-documented failure mode with an observed path to harm rather than a measured one. And every one of those figures comes from doctors, residents, anaesthetists, or ambulance crews. None of it is nursing handover, the one nursing meta-analysis is too heterogeneous to use, and whether these rates transfer to this handover is an assumption rather than a finding.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', `Hourly urine output continues to be measured and recorded${this.reconstructedAt === null ? '' : ` against the threshold of ${URINE_THRESHOLD_ML} millilitres the plan names, with consecutive hours counted rather than each hour read alone`}, and the drain output is recorded with its appearance. The observations were always going to be done; what the plan supplies is what they mean.`);
      case 'reassess': {
        this.spokenRecord = { atTick: tick, spokenElements: [...LOST_CONTINGENCY_SPOKEN], contingencyWasSpoken: false };
        this.notesRecord = { atTick: tick, recordedElements: [...LOST_CONTINGENCY_RECORDED],
          contingencyInTheRecord: true, urineThresholdMl: URINE_THRESHOLD_ML };
        this.observation = { ...this.spokenRecord, ...this.notesRecord,
          urineHourlyMl: URINE_HOURLY_ML,
          consecutiveHoursBelowThreshold: 0 };
        this.observedPhase = this.phase;
        if (this.confirmationArrived) this.confirmationObserved = true;
        const view = this.observation;
        return emit(this.confirmationArrived ? 'confirmed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: ${view.spokenElements.length} elements were spoken, ${view.recordedElements.length} are written, and the difference is the contingency. ${this.reconstructedAt === null ? 'It is still held only in the notes.' : `It is reconstructed and held on the shift, with its threshold of ${view.urineThresholdMl} millilitres.`} ${this.outputReported ? `The last hourly output was ${view.urineHourlyMl} millilitres, above the threshold, with ${view.consecutiveHoursBelowThreshold} consecutive hours below it. ` : ''}${this.confirmationArrived ? 'The surgical registrar has confirmed the plan stands as written.' : 'No confirmation has come back yet.'} No diagnosis, cause, or outcome is established here.`);
      }
      case 'nothing-said-means-nothing-applies':
        this.nothingSaidReadAsNothingApplies = true;
        return emit('nothing-applies-refused', 'Treating an unmentioned plan as an absent plan was refused. The plan is in the notes, signed and dated by the team that wrote it, and it did not stop applying because nobody repeated it at eight o’clock. What a silent handover establishes is that the receiver does not know something, which is a fact about the receiver rather than about the patient.');
      case 'ask-the-day-nurse-to-remember':
        this.memoryAskedFor = true;
        return emit('memory-refused', 'Telephoning the day nurse at home to ask what else there was, was refused. She left three hours ago, she would be reconstructing from memory what she omitted from memory, and the written plan she is being asked to recall is on the ward and can simply be read. Memory is the thing that failed; asking it again is not a check.');
      case 'a-quiet-handover-means-a-stable-patient':
        this.quietReadAsStable = true;
        return emit('quiet-refused', 'Reading a short handover as evidence of a straightforward patient was refused. The length of a handover measures how much was said, and the two are related only when everything relevant was said. This handover was short because a line was left out of it, and the patient it describes is the same either way.');
      case 'write-a-plan-of-my-own':
        this.ownPlanAttempted = true;
        return emit('own-plan-refused', 'Writing a fresh contingency plan was refused, and no threshold, trigger, or action was authored here. A plan invented at the bedside to replace one that already exists creates a second plan, and the next reader has no way to tell which one the surgical team meant. The recovery from a lost plan is to go and find the plan.');
      case 'handoff':
        if (this.spokenRecordedAt === null || this.notesCheckedAt === null || this.gapRecordedAt === null
          || this.reconstructedAt === null || this.consequencesRecordedAt === null || this.confirmationAt === null
          || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record what was said, read the notes, record the difference as a transmission gap, reconstruct the plan from the record, state what the gap changed, take the plan to the team to confirm it stands, review the boundaries, keep the observations against its threshold, and take a current full assessment. A triggered plan and a resolved patient are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the plan, the thresholds, and every treatment decision. This time the contingency is said out loud, in the surgical team's words, with its trigger, its threshold, its action, and its owner, and it is said before it is needed rather than after. What also travels is that it was missing from the handover this shift received and was recovered from the notes, because a receiver who is told that is a receiver who checks. ${this.confirmationObserved ? 'The surgical registrar confirmed it stands as written. ' : ''}Practice ends, not care, and no cause, trajectory, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional handover lesson. No care was started.');
    }
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // She is not deteriorating and does not begin to. A patient who declined would let a learner
    // treat the decline as the reason the plan mattered, when the point is that it mattered before.
    return { heartRateBpm: 88, systolicMmHg: 118, diastolicMmHg: 70, meanArterialMmHg: 86,
      respiratoryRateBpm: 17, spo2Percent: 96, coreTemperatureC: 37.1,
      alertness: 'awake, comfortable, oriented, asleep between observations' };
  }

  snapshot(_tick: number): LostContingencySnapshot {
    return {
      spokenRecordedAtTick: this.spokenRecordedAt,
      notesCheckedAtTick: this.notesCheckedAt,
      gapRecordedAtTick: this.gapRecordedAt,
      reconstructedAtTick: this.reconstructedAt,
      consequencesRecordedAtTick: this.consequencesRecordedAt,
      confirmationAtTick: this.confirmationAt,
      boundariesReviewedAtTick: this.boundariesAt,
      monitoringAtTick: this.monitoringAt,
      spokenElements: [...LOST_CONTINGENCY_SPOKEN],
      recordedElements: [...LOST_CONTINGENCY_RECORDED],
      contingencyInTheRecord: true,
      // Never true. The gap is in the transfer, and the record is not what failed.
      contingencyWasSpoken: false,
      contingencyReconstructed: this.reconstructedAt === null ? null : LOST_CONTINGENCY_RECORDED[3]!,
      urineHourlyMl: URINE_HOURLY_ML,
      urineThresholdMl: URINE_THRESHOLD_ML,
      consecutiveHoursBelowThreshold: 0,
      outputReported: this.outputReported,
      confirmationArrived: this.confirmationArrived,
      confirmationObserved: this.confirmationObserved,
      nothingSaidReadAsNothingApplies: this.nothingSaidReadAsNothingApplies,
      memoryAskedFor: this.memoryAskedFor,
      quietReadAsStable: this.quietReadAsStable,
      ownPlanAttempted: this.ownPlanAttempted,
      spokenRecord: this.spokenRecord ? { ...this.spokenRecord } : null,
      notesRecord: this.notesRecord ? { ...this.notesRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
