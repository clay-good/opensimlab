import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalHyponatremiaSnapshot } from '@platform/kernel/protocol';
export type { RenalHyponatremiaSnapshot } from '@platform/kernel/protocol';

// Authored assessment contrasts, not treatment kinetics, required waits, or grading deadlines.
export const RENAL_HYPONATREMIA_RESCUE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPONATREMIA_ADDITIONAL_RESCUE_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPONATREMIA_DELAY_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPONATREMIA_TAKEOVER_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPONATREMIA_SESSION_TICKS = 240 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPONATREMIA_ACTIONS = ['rescue', 'call-support', 'review-context', 'monitor',
  'check-sodium', 'check-neurology', 'reassess', 'evaluate-neurology', 'additional-rescue',
  'handoff', 'normalize-now', 'sodium-means-recovered', 'siadh-now'] as const;
export type RenalHyponatremiaAction = typeof RENAL_HYPONATREMIA_ACTIONS[number];
export interface RenalHyponatremiaEvent { readonly id: string; readonly message: string }

export function supportsRenalHyponatremia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hyponatremia-symptoms-and-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-hyponatremia').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-hyponatremia-boundary').length === 1;
}

/** Measured sodium improvement never stands in for a neurologic examination. */
export class RenalHyponatremia {
  private rescueAt: number | null = null;
  private additionalAt: number | null = null;
  private supportAt: number | null = null;
  private contextAt: number | null = null;
  private monitoringAt: number | null = null;
  private neurologicReviewAt: number | null = null;
  private responded = false;
  private additionalResponded = false;
  private delayed = false;
  private sodium = 118;
  private initialObserved = false;
  private additionalObserved = false;
  private persistentObserved = false;
  private normalizationAttempted = false;
  private numberOnlyAttempted = false;
  private siadhAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private sodiumObservation: RenalHyponatremiaSnapshot['sodiumObservation'] = null;
  private neurologicObservation: RenalHyponatremiaSnapshot['neurologicObservation'] = null;
  private observation: RenalHyponatremiaSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RenalHyponatremiaSnapshot['ended'] = null;

  advance(tick: number): RenalHyponatremiaEvent[] {
    if (this.ended) return [];
    const stopAt = this.rescueAt === null ? RENAL_HYPONATREMIA_TAKEOVER_TICKS : RENAL_HYPONATREMIA_SESSION_TICKS;
    const until = Math.min(tick, stopAt);
    const events: RenalHyponatremiaEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.delayed && this.rescueAt === null && until >= RENAL_HYPONATREMIA_DELAY_TICKS) {
      due.push({ at: RENAL_HYPONATREMIA_DELAY_TICKS, apply: () => {
        this.delayed = true; this.phase += 1;
        events.push({ id: 'clinical-deterioration', message: 'Visible pulse, pressure, and breathing findings worsen in this authored untreated contrast. Confusion, headache, and nausea persist. The teaching clock is not a safe waiting period or a grading cutoff; no seizure or permanent injury is predicted.' });
      } });
    }
    if (this.rescueAt !== null && !this.responded && until >= this.rescueAt + RENAL_HYPONATREMIA_RESCUE_TICKS) {
      due.push({ at: this.rescueAt + RENAL_HYPONATREMIA_RESCUE_TICKS, apply: () => {
        this.responded = true; this.sodium = 123; this.phase += 1;
        events.push({ id: 'rescue-checkpoint', message: 'The authored post-rescue assessment checkpoint is ready. Request current sodium and neurologic findings together. Elapsed time and a better monitor do not prove symptom recovery; continue clinical monitoring rather than waiting for a teaching clock.' });
      } });
    }
    if (this.additionalAt !== null && !this.additionalResponded && until >= this.additionalAt + RENAL_HYPONATREMIA_ADDITIONAL_RESCUE_TICKS) {
      due.push({ at: this.additionalAt + RENAL_HYPONATREMIA_ADDITIONAL_RESCUE_TICKS, apply: () => {
        this.additionalResponded = true; this.sodium = 124; this.phase += 1;
        events.push({ id: 'additional-rescue-checkpoint', message: 'The authored assessment after the selected limited additional rescue is ready. Obtain fresh sodium and neurologic findings; the checkpoint does not establish symptom recovery, a treatment stop, or correction safety.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= stopAt) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends this unfinished rehearsal. Review urgent symptom-led rescue, serial sodium and neurologic findings, alternative causes, cumulative correction, and continuing expert ownership. This teaching stop does not predict a clinical outcome or establish a safe treatment delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalHyponatremiaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'rescue':
        if (this.rescueAt !== null) return events;
        this.rescueAt = tick;
        return emit('rescue', 'Qualified monitored hypertonic rescue begins for the supplied symptomatic hypotonic hyponatremia. It does not wait for support acknowledgment, a cause label, or another laboratory click. No dose, product concentration, route selection, or delivery rate is prescribed.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Experienced acute-care and endocrine or renal support share treatment, close monitoring, and escalation. Urgent rescue proceeds without waiting for administrative acknowledgment.');
      case 'review-context':
        if (this.contextAt !== null) return events;
        this.contextAt = tick;
        return emit('context-review', 'Review the supplied baseline sodium 118 mmol/L, measured hypotonicity, symptoms, recent thiazide exposure, and uncertain duration. Concentrated urine and urine sodium during diuretic exposure do not establish SIAD. Keep the original baseline and correction window; this review supplies no new laboratory results.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Arrange close sodium, neurologic, urine-output, fluid-balance, and clinical surveillance with experienced supervision and a consistent sodium measurement method. Detect changing water excretion and cumulative correction; arranging checks does not acquire their results.');
      case 'evaluate-neurology':
        if (this.neurologicReviewAt !== null) return events;
        this.neurologicReviewAt = tick;
        return emit('neurologic-review', 'Qualified review of persistent symptoms and alternative neurologic or systemic causes begins alongside symptom-directed treatment. No diagnosis, imaging result, neurologic recovery, or sodium change is generated by requesting this investigation.');
      case 'check-sodium':
        this.sodiumObservation = this.sodiumFinding(tick);
        return emit('sodium-check', `Requested fictional sodium: ${this.sodium} mmol/L, a change of +${this.sodium - 118} mmol/L from the original 118 baseline. This partial check does not refresh the neurologic examination or establish recovery.`);
      case 'check-neurology':
        this.neurologicObservation = this.neurologicFinding(tick);
        return emit('neurologic-check', 'Requested neurologic assessment: awake but confused, with headache and nausea still present. This partial examination does not supply a current sodium result or reset the correction window.');
      case 'reassess':
        this.sodiumObservation = this.sodiumFinding(tick);
        this.neurologicObservation = this.neurologicFinding(tick);
        this.observation = { ...this.sodiumObservation, ...this.neurologicObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.responded && !this.additionalResponded) this.initialObserved = true;
        if (this.additionalResponded) this.additionalObserved = true;
        if (this.responded) this.persistentObserved = true;
        return emit(this.additionalResponded ? 'additional-response-reassessment' : this.responded
          ? 'persistent-symptoms-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: sodium ${this.sodium} mmol/L, +${this.sodium - 118} mmol/L from the original 118 baseline; the patient remains awake but confused, with headache and nausea. There is no meaningful symptom improvement. Sodium correction is not neurologic recovery, and alternative causes and further treatment decisions remain under expert review.`);
      case 'additional-rescue':
        if (this.additionalAt !== null) return events;
        if (!this.responded || this.observation === null || this.observedPhase !== this.phase) {
          return emit('additional-rescue-refused', 'Obtain a current combined sodium and neurologic assessment after the initial rescue before selecting a further intervention. A sodium-only check, a neurologic-only check, or an old panel does not establish the present response. This assessment gate does not delay the independent initial rescue.');
        }
        this.additionalAt = tick;
        return emit('additional-rescue', 'Qualified limited additional rescue begins under the selected Society for Endocrinology 2022 pathway after a measured +5 mmol/L rise without clinical improvement. Alternative-cause investigation proceeds alongside it, not as an administrative prerequisite. This is not blind normalization or a universal regional protocol, and no dose is prescribed.');
      case 'normalize-now':
        this.normalizationAttempted = true;
        return emit('normalization-refused', 'Blind sodium normalization was not started. Ongoing treatment must balance symptoms, the original correction window, measured change, water excretion, and expert reassessment. This lesson does not calculate dosing or certify freedom from overcorrection injury.');
      case 'sodium-means-recovered':
        this.numberOnlyAttempted = true;
        return emit('number-only-recovery-refused', 'Recovery was not declared from the sodium number. Confusion, headache, and nausea persist; current combined findings and investigation of other causes remain necessary. This attempted shortcut is retained without preventing later appropriate care.');
      case 'siadh-now':
        this.siadhAttempted = true;
        return emit('siadh-label-refused', 'A definitive SIAD label was not assigned. The supplied urine findings and recent thiazide exposure do not establish that diagnosis, and other causes require qualified evaluation. Cause investigation does not postpone urgent symptom-led rescue.');
      case 'handoff':
        if (this.rescueAt === null || this.additionalAt === null || this.supportAt === null || this.contextAt === null
          || this.monitoringAt === null || this.neurologicReviewAt === null || !this.additionalResponded
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the selected rescue pathway, support, context, monitoring, neurologic investigation, and current combined findings after the additional response before handoff. Partial checks cannot refresh the full panel. Earlier extra panels and an error-free history are not required.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving expert team owns persistent confusion, headache, and nausea; the original sodium baseline and cumulative correction; ongoing sodium, neurologic, urine-output, and fluid surveillance; alternative-cause investigation; and further treatment decisions. The +6 teaching checkpoint is not a clinical stopping rule, normalization, a diagnosis, or proof of freedom from delayed injury.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional renal hyponatremia lesson. No care was started.');
    }
  }

  private sodiumFinding(tick: number) { return { atTick: tick, sodiumMmolL: this.sodium, changeFromBaselineMmolL: this.sodium - 118 }; }
  private neurologicFinding(tick: number) { return { atTick: tick, alertness: 'awake but confused', headache: true, nausea: true }; }
  rhythm(): 'sinus' { return 'sinus'; }
  vitals() {
    const circulation = this.responded
      ? { systolicMmHg: 126, diastolicMmHg: 74, meanArterialMmHg: 91, heartRateBpm: 88, respiratoryRateBpm: 16 }
      : this.delayed
        ? { systolicMmHg: 140, diastolicMmHg: 82, meanArterialMmHg: 101, heartRateBpm: 102, respiratoryRateBpm: 20 }
        : { systolicMmHg: 132, diastolicMmHg: 78, meanArterialMmHg: 96, heartRateBpm: 92, respiratoryRateBpm: 18 };
    return { ...circulation, spo2Percent: 98, coreTemperatureC: 36.7, alertness: 'awake but confused' };
  }
  snapshot(tick: number): RenalHyponatremiaSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return { supportActive: this.supportAt !== null, contextReviewedAtTick: this.contextAt, monitoringAtTick: this.monitoringAt,
      rescueAtTick: this.rescueAt, additionalRescueAtTick: this.additionalAt, neurologicReviewAtTick: this.neurologicReviewAt,
      rescueDueInSeconds: !this.ended && this.rescueAt !== null && !this.responded ? remaining(this.rescueAt, RENAL_HYPONATREMIA_RESCUE_TICKS) : null,
      additionalRescueDueInSeconds: !this.ended && this.additionalAt !== null && !this.additionalResponded
        ? remaining(this.additionalAt, RENAL_HYPONATREMIA_ADDITIONAL_RESCUE_TICKS) : null,
      initialResponseObserved: this.initialObserved, additionalResponseObserved: this.additionalObserved,
      persistentSymptomsObserved: this.persistentObserved, sodiumNormalizationAttempted: this.normalizationAttempted,
      numberOnlyRecoveryAttempted: this.numberOnlyAttempted, siadhLabelAttempted: this.siadhAttempted,
      sodiumObservation: this.sodiumObservation ? { ...this.sodiumObservation } : null,
      neurologicObservation: this.neurologicObservation ? { ...this.neurologicObservation } : null,
      observation: this.observation ? { ...this.observation } : null,
      alertness: this.vitals().alertness, choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
