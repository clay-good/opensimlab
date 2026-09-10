import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalProteinuriaRatioSnapshot } from '@platform/kernel/protocol';
export type { RenalProteinuriaRatioSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not kinetics, safe waits, or grading deadlines.
export const RENAL_PROTEINURIA_REPEAT_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_PROTEINURIA_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const RENAL_PROTEINURIA_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_PROTEINURIA_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
/** The supplied pair, and what the rise between them comes to. */
export const RENAL_PROTEINURIA_PREVIOUS_MG_PER_G = 168;
export const RENAL_PROTEINURIA_CURRENT_MG_PER_G = 312;
export const RENAL_PROTEINURIA_REPEAT_MG_PER_G = 189;
export const RENAL_PROTEINURIA_ACTIONS = ['compare-variation', 'review-sampling', 'review-patient',
  'request-repeat', 'own-decision', 'call-support', 'monitor', 'check-ratio', 'check-clinical',
  'reassess', 'handoff', 'change-treatment', 'call-it-progression'] as const;
export type RenalProteinuriaAction = typeof RENAL_PROTEINURIA_ACTIONS[number];
export interface RenalProteinuriaEvent { readonly id: string; readonly message: string }

export function supportsRenalProteinuriaRatio(scenario: Scenario): boolean {
  return scenario.metadata.id === 'proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-proteinuria').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-proteinuria-boundary').length === 1;
}

/**
 * The one lesson in this module where the missing measurement can actually be obtained.
 *
 * Slices 10 and 11 end with the question open because nothing available would close it. Here
 * the answer was available the whole time and nobody asked for it: a first morning sample under
 * matched conditions comes back at 189 mg/g. That still does not close the question -- one
 * matched value is not a timed collection and not a cause -- but it narrows it, and the point
 * is that narrowing it cost one request nobody made.
 */
export class RenalProteinuriaRatio {
  private variationAt: number | null = null;
  private samplingAt: number | null = null;
  private patientAt: number | null = null;
  private repeatAt: number | null = null;
  private decisionAt: number | null = null;
  private supportAt: number | null = null;
  private monitoringAt: number | null = null;
  private repeatReturned = false;
  private uncompared = false;
  private changeAttempted = false;
  private progressionAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private ratioObservation: RenalProteinuriaRatioSnapshot['ratioObservation'] = null;
  private clinicalObservation: RenalProteinuriaRatioSnapshot['clinicalObservation'] = null;
  private observation: RenalProteinuriaRatioSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RenalProteinuriaRatioSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.repeatReturned, this.decisionAt !== null, this.uncompared]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): RenalProteinuriaEvent[] {
    if (this.ended) return [];
    const terminal = this.variationAt === null && this.repeatAt === null
      ? RENAL_PROTEINURIA_TAKEOVER_TICKS : RENAL_PROTEINURIA_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: RenalProteinuriaEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.uncompared && this.variationAt === null && until >= RENAL_PROTEINURIA_DELAY_TICKS) {
      due.push({ at: RENAL_PROTEINURIA_DELAY_TICKS, apply: () => {
        this.change(() => { this.uncompared = true; });
        events.push({ id: 'uncompared-contrast', message: 'The change still stands uncompared in this authored contrast, and the plan is still to change treatment on it today. Compare the rise against the variation the measurement carries. The teaching clock is not a safe waiting period, a deterioration prediction, or a grading cutoff.' });
      } });
    }
    if (this.repeatAt !== null && !this.repeatReturned && until >= this.repeatAt + RENAL_PROTEINURIA_REPEAT_TICKS) {
      due.push({ at: this.repeatAt + RENAL_PROTEINURIA_REPEAT_TICKS, apply: () => {
        this.change(() => { this.repeatReturned = true; });
        events.push({ id: 'repeat-checkpoint', message: 'The matched first morning sample has returned. Request the findings together. One matched value narrows the question; it is not a timed collection, it establishes no cause, and it does not prove that nothing changed.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the comparison against measurement variation, the sampling conditions, the unchanged clinical picture, and the repeat nobody requested. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalProteinuriaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'compare-variation':
        if (this.variationAt !== null) return events;
        this.variationAt = tick;
        return emit('variation-comparison', `Recorded: the supplied rise from ${RENAL_PROTEINURIA_PREVIOUS_MG_PER_G} to ${RENAL_PROTEINURIA_CURRENT_MG_PER_G} mg/g is +86%. In repeat sampling of clinically stable outpatients, the within-person coefficient of variation for a random spot albumin-creatinine ratio was 29.7%, with reference change values of +124% and −55%. This rise sits inside that band. That does not establish it is noise and does not establish it is real; it establishes that this pair cannot tell them apart, and those reference values describe a stable population rather than ruling out change in an unstable one.`);
      case 'review-sampling':
        if (this.samplingAt !== null) return events;
        this.samplingAt = tick;
        return emit('sampling-review', 'Recorded: both supplied values are random afternoon spot samples. Protein excretion varies through the day, and in the series behind this lesson it peaked at 6 to 12 hours and reached its nadir at 18 to 24, with the first morning void correlating well but reading lower than the 24-hour ratio. A dipstick reports a concentration, so a dilute sample reads lower. None of this makes either supplied value wrong.');
      case 'review-patient':
        if (this.patientAt !== null) return events;
        this.patientAt = tick;
        return emit('patient-review', 'Reviewed: blood pressure 128/78 against 126/76, weight 71 kg at both visits, creatinine unchanged, sediment bland, no oedema, no new medicines, and she reports feeling exactly as she did last time. An unchanged patient beside an uncertain measurement is agreement, not proof that nothing is happening.');
      case 'request-repeat':
        if (this.repeatAt !== null) return events;
        this.repeatAt = tick;
        return emit('repeat-requested', 'A first morning sample under matched conditions is requested with qualified support, rather than a third random afternoon value. This is the measurement that would have distinguished the two readings, and it was available at the last visit as well as this one.');
      case 'own-decision':
        if (this.decisionAt !== null) return events;
        this.change(() => { this.decisionAt = tick; });
        return emit('decision-owned', 'The treatment decision is placed explicitly with the qualified team, with what it rests on stated: a comparison against measurement variation, the sampling conditions, an unchanged clinical picture, and a repeat that is pending or returned. This lesson selects no drug, no dose, and no change, and does not decide whether her treatment should change.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified renal and nursing teams share the interpretation, the repeat sampling, and continuing review. Care does not wait for support acknowledgment.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Arrange continuing review with matched sampling conditions recorded each time, so the next comparison is between things that can be compared. A third random value would add another point of the same scatter.');
      case 'check-ratio':
        this.ratioObservation = this.ratioFinding(tick);
        return emit('ratio-check', `Requested fictional albumin-creatinine ratio: ${this.ratioObservation.ratioMgPerG} mg/g${this.ratioObservation.firstMorning ? ', first morning under matched conditions' : ', random afternoon spot'}. This partial result supplies no clinical findings and settles no cause.`);
      case 'check-clinical':
        this.clinicalObservation = this.clinicalFinding(tick);
        return emit('clinical-check', `Requested fictional clinical findings: blood pressure ${this.clinicalObservation.systolicMmHg}/78 mmHg, weight ${this.clinicalObservation.weightKg} kg, both unchanged. This partial result supplies no ratio and proves nothing on its own.`);
      case 'reassess':
        this.ratioObservation = this.ratioFinding(tick);
        this.clinicalObservation = this.clinicalFinding(tick);
        this.observation = { ...this.ratioFinding(tick), ...this.clinicalFinding(tick), risePercent: 86, ...this.vitals() };
        this.observedPhase = this.phase;
        return emit(this.repeatReturned ? 'repeat-reassessment' : this.uncompared ? 'uncompared-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: albumin-creatinine ratio ${this.observation.ratioMgPerG} mg/g${this.observation.firstMorning ? ' from the matched first morning sample' : ' from a random afternoon spot sample'}; the supplied pair rose ${this.observation.risePercent}% against a reference change of +124%. Blood pressure ${this.observation.systolicMmHg}/${this.observation.diastolicMmHg} mmHg and weight ${this.observation.weightKg} kg, both unchanged; ${this.observation.alertness}. ${this.repeatReturned ? 'The matched value narrows the question. It is not a timed collection, it establishes no cause, and it does not prove that nothing changed.' : 'No matched sample has returned, so the two supplied values are still the only comparison available.'}`);
      case 'change-treatment':
        this.changeAttempted = true;
        return emit('change-treatment-refused', 'Changing treatment today on the strength of this pair of values was refused. A +86% rise sits inside the reference change for a random spot ratio, and no matched sample has been obtained. This refusal is not a claim that her disease is stable, does not say her treatment is correct as it stands, and selects no drug and no dose — it declines to act on a difference this measurement cannot resolve.');
      case 'call-it-progression':
        this.progressionAttempted = true;
        return emit('progression-refused', 'Recording the change as progression was refused. Progression is a claim about her kidney; this is a difference between two random afternoon samples that is smaller than the variation such samples carry. Refusing the label is not the opposite label: nothing here establishes that she is stable either.');
      case 'handoff':
        if (this.variationAt === null || this.samplingAt === null || this.patientAt === null
          || this.repeatAt === null || this.decisionAt === null || this.supportAt === null
          || this.monitoringAt === null || this.observation === null
          || this.observedPhase !== this.phase || !this.repeatReturned) {
          return emit('handoff-refused', 'Record the comparison against measurement variation, the sampling conditions, the clinical review, the matched repeat and its result, the owned treatment decision, support, monitoring, and a current full assessment. A single number that settles the question is not a handoff gate and is not produced.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the treatment decision with what it rests on stated: a +86% rise inside the reference change for a random spot ratio, two afternoon samples compared with each other, an unchanged clinical picture, and a matched first morning value of ${RENAL_PROTEINURIA_REPEAT_MG_PER_G} mg/g. The question is narrower and still open — no timed collection, cause, progression, or stability is established. Practice ends, not follow-up, and nothing here is discharge readiness.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional proteinuria lesson. No care was started.');
    }
  }

  private ratioFinding(tick: number) {
    return { atTick: tick, firstMorning: this.repeatReturned,
      ratioMgPerG: this.repeatReturned ? RENAL_PROTEINURIA_REPEAT_MG_PER_G : RENAL_PROTEINURIA_CURRENT_MG_PER_G };
  }
  private clinicalFinding(tick: number) { return { atTick: tick, systolicMmHg: 128, weightKg: 71 }; }
  rhythm(): 'sinus' { return 'sinus'; }
  vitals() {
    return { heartRateBpm: 72, systolicMmHg: 128, diastolicMmHg: 78, meanArterialMmHg: 95,
      respiratoryRateBpm: 14, spo2Percent: 98, coreTemperatureC: 36.7,
      alertness: 'awake, well, and unchanged from her last visit' };
  }
  snapshot(tick: number): RenalProteinuriaRatioSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return { supportActive: this.supportAt !== null, variationComparedAtTick: this.variationAt,
      samplingReviewedAtTick: this.samplingAt, patientReviewedAtTick: this.patientAt,
      repeatRequestedAtTick: this.repeatAt, decisionOwnedAtTick: this.decisionAt,
      monitoringAtTick: this.monitoringAt,
      repeatDueInSeconds: !this.ended && this.repeatAt !== null && !this.repeatReturned
        ? remaining(this.repeatAt, RENAL_PROTEINURIA_REPEAT_TICKS) : null,
      repeatReturned: this.repeatReturned, uncomparedContrastObserved: this.uncompared,
      changeTreatmentAttempted: this.changeAttempted, callItProgressionAttempted: this.progressionAttempted,
      ratioObservation: this.ratioObservation ? { ...this.ratioObservation } : null,
      clinicalObservation: this.clinicalObservation ? { ...this.clinicalObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
