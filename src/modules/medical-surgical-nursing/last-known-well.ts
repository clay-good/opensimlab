import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LastKnownWellSnapshot } from '@platform/kernel/protocol';
export type { LastKnownWellSnapshot } from '@platform/kernel/protocol';

/**
 * Some uncertainty is irreducible. The time of onset governs everything downstream and nobody in
 * this building knows it. The chart offers a box labelled "onset time", and filling that box with
 * anything at all converts an unknown into a datum that later readers cannot distinguish from a
 * witnessed observation. Recording the boundary is the whole of what can honestly be done.
 */
export const LAST_KNOWN_WELL_RECOLLECTION_TICKS = 12 * 60 * TICKS_PER_SECOND;
export const LAST_KNOWN_WELL_ASSESSMENT_TICKS = 20 * 60 * TICKS_PER_SECOND;
export const LAST_KNOWN_WELL_TAKEOVER_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const LAST_KNOWN_WELL_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const LAST_KNOWN_WELL_ACTIONS = ['record-last-known-well', 'record-the-uncertain-recollection',
  'activate-the-stroke-pathway', 'record-what-the-unknown-changes', 'review-boundaries', 'monitor',
  'check-the-timeline', 'check-patient', 'reassess', 'handoff',
  'chart-the-recollection-as-onset', 'chart-last-known-well-as-onset',
  'unknown-onset-means-nothing-offered', 'wait-for-the-family-to-confirm'] as const;
export type LastKnownWellAction = typeof LAST_KNOWN_WELL_ACTIONS[number];
export interface LastKnownWellEvent { readonly id: string; readonly message: string }

/** The timeline as it exists in the record: two certainties and one thing somebody half-remembers. */
export const LAST_KNOWN_WELL_TIMELINE = [
  { id: 'last-documented', label: 'Last documented interaction, nursing entry', clock: '22:40', certain: true },
  { id: 'recollection', label: 'A care assistant thinks she said hello, not certain', clock: 'about 03:00', certain: false },
  { id: 'found', label: 'Found with new right-sided weakness', clock: '06:10', certain: true },
] as const;

export function supportsLastKnownWell(scenario: Scenario): boolean {
  return scenario.metadata.id === 'last-known-well-a-time-nobody-can-supply'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'last-known-well').length === 1
    && scenario.timeline.filter((event) => event.target === 'last-known-well-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'last-known-well-boundary').length === 1;
}

export class LastKnownWell {
  private boundRecordedAt: number | null = null;
  private recollectionRecordedAt: number | null = null;
  private pathwayAt: number | null = null;
  private consequencesRecordedAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private recollectionPressed = false;
  private assessmentArrived = false;
  private assessmentObserved = false;
  private recollectionCharted = false;
  private boundCharted = false;
  private nothingOffered = false;
  private waitedForFamily = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private timelineRecord: LastKnownWellSnapshot['timelineRecord'] = null;
  private patientRecord: LastKnownWellSnapshot['patientRecord'] = null;
  private observation: LastKnownWellSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: LastKnownWellSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.recollectionPressed, this.assessmentArrived]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): LastKnownWellEvent[] {
    if (this.ended) return [];
    const terminal = this.pathwayAt === null ? LAST_KNOWN_WELL_TAKEOVER_TICKS : LAST_KNOWN_WELL_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: LastKnownWellEvent[] = [];
    if (!this.recollectionPressed && until >= LAST_KNOWN_WELL_RECOLLECTION_TICKS) {
      this.change(() => { this.recollectionPressed = true; });
      events.push({ id: 'recollection-pressed', message: 'Someone asks the care assistant to pin the time down. Pressed, she says it might have been three, or it might have been closer to two, and that she would not want to swear to it. Pressing an uncertain recollection does not make it certain; it makes the person saying it less willing to keep saying it is uncertain.' });
    }
    // The qualified team assesses when the pathway is activated, and not otherwise.
    if (!this.assessmentArrived && this.pathwayAt !== null
      && until >= this.pathwayAt + LAST_KNOWN_WELL_ASSESSMENT_TICKS) {
      this.change(() => { this.assessmentArrived = true; });
      events.push({ id: 'assessment-arrived', message: 'The stroke team assesses. They record the last documented interaction as a bound rather than an onset, note the recollection separately and as uncertain, and proceed on imaging-based assessment rather than on a remembered clock time. Their eligibility decision is theirs; what the ward supplied was an honest timeline.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded bound, the recollection kept separate and uncertain, and activation on a deficit rather than on a time. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): LastKnownWellEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-last-known-well':
        if (this.boundRecordedAt !== null) return events;
        this.boundRecordedAt = tick;
        return emit('bound-recorded', `Last known well is recorded as 22:40, labelled as the last documented interaction and explicitly as a bound rather than an onset. It says the deficit began at some point after that time, which is true and useful. It does not say the deficit began at that time, which nobody knows.`);
      case 'record-the-uncertain-recollection':
        if (this.recollectionRecordedAt !== null) return events;
        this.recollectionRecordedAt = tick;
        return emit('recollection-recorded', `The care assistant's account is recorded in her words and in its own field: she thinks she said hello at about three but is not certain. It is kept beside the timeline rather than inside it, because an uncertain recollection entered as a timestamp becomes indistinguishable from a witnessed one the moment the next person reads it.`);
      case 'activate-the-stroke-pathway':
        if (this.pathwayAt !== null) return events;
        this.pathwayAt = tick;
        return emit('pathway-activated', `The stroke pathway is activated on the deficit${this.recollectionPressed ? ', without waiting for the recollection to firm up' : ''}. Activation depends on a new focal deficit, not on knowing when it started, and the assessment that follows is the qualified team's to make.`);
      case 'record-what-the-unknown-changes':
        if (this.boundRecordedAt === null) {
          return emit('consequences-refused', 'There is no recorded bound yet, so there is nothing whose consequences can be stated.');
        }
        if (this.consequencesRecordedAt !== null) return events;
        this.consequencesRecordedAt = tick;
        return emit('consequences-recorded', 'The record states what the unknown changes and what it does not. It does not change the deficit, the activation, or the observations. It changes which assessments the qualified team will use to decide, because an unwitnessed onset is assessed by imaging rather than by a clock. Handing over an honest unknown lets them do that; handing over a manufactured time does not.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. Last known well is a bound: the deficit began after it. It is not an onset and should never be charted as one. An unknown time of onset is a reason to escalate for assessment rather than a reason to stand down: a randomised trial in patients with unknown-onset deficits found a higher rate of favourable outcome in the treated group, with eligibility resting on imaging as a surrogate for lesion age rather than on any remembered time. That trial describes a population and an assessment pathway; it does not establish what will happen to this patient, and the eligibility decision is not the ward’s to make.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Neurological observation continues at defined intervals with each finding timed, because from this point forward the times are knowable and worth recording precisely. The gap in the record is behind; the record from now on does not have to have one.');
      case 'check-the-timeline':
        this.timelineRecord = this.timelineFinding(tick);
        return emit('timeline-check', `Requested timeline: ${LAST_KNOWN_WELL_TIMELINE.map((entry) => `${entry.clock}, ${entry.label.toLowerCase()}, ${entry.certain ? 'documented' : 'uncertain'}`).join('; ')}. ${this.timelineRecord.certainEntries} of ${this.timelineRecord.totalEntries} entries are documented. The interval containing the onset is ${this.timelineRecord.unwitnessedHours} hours wide. This partial check supplies no examination of the patient.`);
      case 'check-patient':
        this.patientRecord = this.patientFinding(tick);
        return emit('patient-check', `Requested observation: ${this.patientRecord.focalDeficit ? 'new right-sided weakness present' : 'no focal deficit'}; ${this.patientRecord.speaking ? 'speaking, with word-finding difficulty' : 'not speaking'}; blood glucose ${this.patientRecord.glucoseMmolL.toFixed(1)} mmol/L; ${this.patientRecord.airwayProtected ? 'airway protected' : 'airway at risk'}. The deficit is what activates the pathway, and it is present whatever time it began. This partial observation supplies no timeline.`);
      case 'reassess': {
        this.timelineRecord = this.timelineFinding(tick);
        this.patientRecord = this.patientFinding(tick);
        this.observation = { ...this.timelineRecord, ...this.patientRecord };
        this.observedPhase = this.phase;
        if (this.assessmentArrived) this.assessmentObserved = true;
        const view = this.observation;
        return emit(this.assessmentArrived ? 'assessed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: ${view.focalDeficit ? 'new right-sided weakness persists' : 'no focal deficit'}; ${view.speaking ? 'speaking with word-finding difficulty' : 'not speaking'}; blood glucose ${view.glucoseMmolL.toFixed(1)} mmol/L. The unwitnessed interval remains ${view.unwitnessedHours} hours wide and will not narrow. ${this.assessmentArrived ? 'The stroke team has assessed and is proceeding on imaging-based assessment rather than a remembered time.' : 'No time of onset has become available, and none is going to.'} No diagnosis, eligibility, or outcome is established here.`);
      }
      case 'chart-the-recollection-as-onset':
        this.recollectionCharted = true;
        return emit('recollection-charted-refused', 'Entering three o’clock in the onset field was refused. She is not certain, and pressed she moved it by an hour. A time entered into that box is read downstream as a time somebody observed, and no later reader can tell the difference between a recollection and a witnessed event once both are four digits in the same field.');
      case 'chart-last-known-well-as-onset':
        this.boundCharted = true;
        return emit('bound-charted-refused', 'Entering 22:40 in the onset field was refused. It is defensible as a bound and wrong as an onset: it asserts the deficit began at the last moment anyone saw her well, which is the earliest possible time rather than a known one. Recording the safest-sounding number is still recording a number nobody measured.');
      case 'unknown-onset-means-nothing-offered':
        this.nothingOffered = true;
        return emit('nothing-offered-refused', 'Treating an unknown onset as a reason to stand down was refused. A randomised trial enrolled precisely this population, patients with deficits of unknown onset, and assessed eligibility by imaging rather than by a remembered clock. An unknown time is a reason to escalate for that assessment, not a reason to stop.');
      case 'wait-for-the-family-to-confirm':
        this.waitedForFamily = true;
        return emit('waiting-refused', 'Waiting for the family to supply a time was refused. Nobody who was present knows it, and the family were not here; a time produced by a telephone call at this distance would be another recollection wearing a timestamp. The deficit is present now and activation does not depend on the answer.');
      case 'handoff':
        if (this.boundRecordedAt === null || this.recollectionRecordedAt === null || this.pathwayAt === null
          || this.consequencesRecordedAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record last known well as a bound, record the recollection separately and as uncertain, activate the pathway on the deficit, state what the unknown changes, review the boundaries, arrange timed neurological observation, and take a current full assessment. A settled onset time and a resolved eligibility are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns assessment, imaging, eligibility, and every treatment decision. What travels is 22:40 labelled as a bound rather than an onset, the care assistant's account in her words and marked uncertain, that the pathway was activated on the deficit, and that the onset field is empty because nobody knows what belongs in it. ${this.assessmentObserved ? 'The stroke team recorded the same distinction. ' : ''}Practice ends, not care, and no onset, eligibility, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional timeline lesson. No care was started.');
    }
  }

  private timelineFinding(tick: number) {
    return { atTick: tick, certainEntries: LAST_KNOWN_WELL_TIMELINE.filter((entry) => entry.certain).length,
      totalEntries: LAST_KNOWN_WELL_TIMELINE.length, unwitnessedHours: 7.5 };
  }

  private patientFinding(tick: number) {
    return { atTick: tick, focalDeficit: true, speaking: true, glucoseMmolL: 6.2,
      airwayProtected: true };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // The deficit is fixed. Nothing about the patient resolves the timeline question, which is the
    // point: no amount of looking at her will supply the missing hours.
    return { heartRateBpm: 86, systolicMmHg: 158, diastolicMmHg: 88, meanArterialMmHg: 111,
      respiratoryRateBpm: 16, spo2Percent: 96, coreTemperatureC: 36.7,
      alertness: 'awake, new right-sided weakness, word-finding difficulty' };
  }

  snapshot(_tick: number): LastKnownWellSnapshot {
    return {
      boundRecordedAtTick: this.boundRecordedAt,
      recollectionRecordedAtTick: this.recollectionRecordedAt,
      pathwayActivatedAtTick: this.pathwayAt,
      consequencesRecordedAtTick: this.consequencesRecordedAt,
      boundariesReviewedAtTick: this.boundariesAt,
      monitoringAtTick: this.monitoringAt,
      lastKnownWellClock: LAST_KNOWN_WELL_TIMELINE[0]!.clock,
      foundClock: LAST_KNOWN_WELL_TIMELINE[2]!.clock,
      unwitnessedHours: 7.5,
      // Never populated in this lesson. The empty field is the honest answer.
      onsetTimeRecorded: null,
      recollectionPressed: this.recollectionPressed,
      assessmentArrived: this.assessmentArrived,
      assessmentObserved: this.assessmentObserved,
      recollectionChartedAttempted: this.recollectionCharted,
      boundChartedAttempted: this.boundCharted,
      nothingOfferedAttempted: this.nothingOffered,
      waitedForFamily: this.waitedForFamily,
      timelineRecord: this.timelineRecord ? { ...this.timelineRecord } : null,
      patientRecord: this.patientRecord ? { ...this.patientRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
