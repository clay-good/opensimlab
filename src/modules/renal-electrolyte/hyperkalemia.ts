import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalHyperkalemiaSnapshot } from '@platform/kernel/protocol';
export type { RenalHyperkalemiaSnapshot } from '@platform/kernel/protocol';

// Authored contrasts, not calcium duration guarantees, potassium kinetics, or safe waiting intervals.
export const RENAL_HYPERKALEMIA_CALCIUM_TICKS = 45 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERKALEMIA_SHIFT_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERKALEMIA_REMOVAL_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERKALEMIA_REBOUND_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERKALEMIA_DELAY_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERKALEMIA_TAKEOVER_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERKALEMIA_SESSION_TICKS = 360 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERKALEMIA_ACTIONS = ['calcium', 'shift', 'call-support', 'review-context',
  'plan-removal', 'deliver-removal', 'monitor', 'check-ecg', 'check-glucose', 'reassess',
  'handoff', 'ecg-resolved', 'stop-glucose-monitoring'] as const;
export type RenalHyperkalemiaAction = typeof RENAL_HYPERKALEMIA_ACTIONS[number];
export interface RenalHyperkalemiaEvent { readonly id: string; readonly message: string }

export function supportsRenalHyperkalemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hyperkalemia-cardioprotection-and-rebound'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-hyperkalemia').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-hyperkalemia-boundary').length === 1;
}

/** Separate cardiac protection, redistribution, and delivered removal without a dose or clearance solver. */
export class RenalHyperkalemia {
  private tick = 0;
  private calciumAt: number | null = null;
  private lastCalciumAt: number | null = null;
  private calciumRequests = 0;
  private calciumExpired = false;
  private shiftAt: number | null = null;
  private removalAt: number | null = null;
  private supportAt: number | null = null;
  private contextAt: number | null = null;
  private removalPlanAt: number | null = null;
  private monitoringAt: number | null = null;
  private shifted = false;
  private removed = false;
  private rebound = false;
  private reboundCheckpoint = false;
  private delayed = false;
  private potassium = 6.9;
  private glucose = 108;
  private shiftObserved = false;
  private removalObserved = false;
  private reboundObserved = false;
  private ecgResolvedAttempted = false;
  private glucoseMonitoringStopAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observation: RenalHyperkalemiaSnapshot['observation'] = null;
  private ecgObservation: RenalHyperkalemiaSnapshot['ecgObservation'] = null;
  private glucoseObservation: RenalHyperkalemiaSnapshot['glucoseObservation'] = null;
  private feedback: string | null = null;
  private ended: RenalHyperkalemiaSnapshot['ended'] = null;

  private clinicalState(): string {
    return JSON.stringify([this.potassium, this.glucose, this.rhythm(), this.vitals()]);
  }

  advance(tick: number): RenalHyperkalemiaEvent[] {
    if (this.ended) return [];
    const before = this.clinicalState();
    const stopAt = this.shiftAt === null && this.removalAt === null
      ? RENAL_HYPERKALEMIA_TAKEOVER_TICKS : RENAL_HYPERKALEMIA_SESSION_TICKS;
    this.tick = Math.min(tick, stopAt);
    const events: RenalHyperkalemiaEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (this.lastCalciumAt !== null && !this.calciumExpired && this.tick - this.lastCalciumAt >= RENAL_HYPERKALEMIA_CALCIUM_TICKS) {
      due.push({ at: this.lastCalciumAt + RENAL_HYPERKALEMIA_CALCIUM_TICKS, apply: () => {
      this.calciumExpired = true;
      events.push({ id: 'calcium-review-checkpoint', message: 'The finite authored calcium-effect interval has elapsed. Reassess the current ECG and whole patient; this reminder does not prove recurrent toxicity or prescribe automatic repeat calcium. Calcium never removed potassium.' });
      } });
    }
    if (!this.delayed && this.shiftAt === null && this.removalAt === null && this.tick >= RENAL_HYPERKALEMIA_DELAY_TICKS) {
      due.push({ at: RENAL_HYPERKALEMIA_DELAY_TICKS, apply: () => {
      this.delayed = true;
      events.push({ id: 'clinical-deterioration', message: 'Visible perfusion and pulse findings worsen in the authored untreated contrast. Cardiac protection alone does not lower potassium. Escalate qualified shifting and removal care; this clock is not a grading deadline or a predicted injury.' });
      } });
    }
    if (this.shiftAt !== null && !this.shifted && this.tick - this.shiftAt >= RENAL_HYPERKALEMIA_SHIFT_TICKS) {
      due.push({ at: this.shiftAt + RENAL_HYPERKALEMIA_SHIFT_TICKS, apply: () => {
      this.shifted = true;
      if (!this.removed) { this.potassium = 5.6; this.glucose = 104; }
      events.push({ id: 'shift-checkpoint', message: 'The authored shifting reassessment checkpoint is ready. Obtain potassium, glucose, ECG, and bedside findings; redistribution is temporary and does not remove potassium. The clock does not replace earlier clinical checks.' });
      } });
    }
    if (this.removalAt !== null && !this.removed && this.tick - this.removalAt >= RENAL_HYPERKALEMIA_REMOVAL_TICKS) {
      due.push({ at: this.removalAt + RENAL_HYPERKALEMIA_REMOVAL_TICKS, apply: () => {
      this.removed = true; this.potassium = 5.1; this.glucose = 100;
      events.push({ id: 'removal-checkpoint', message: 'The authored delivered-removal reassessment checkpoint is ready. Obtain current findings and hand off continuing renal and glucose surveillance. This is not a dialysis or binder kinetic prediction, normalized kidney function, or proof of durable safety.' });
      } });
    }
    if (this.shiftAt !== null && !this.reboundCheckpoint && this.tick - this.shiftAt >= RENAL_HYPERKALEMIA_REBOUND_TICKS) {
      due.push({ at: this.shiftAt + RENAL_HYPERKALEMIA_REBOUND_TICKS, apply: () => {
      this.reboundCheckpoint = true;
      if (!this.removed) { this.rebound = true; this.potassium = 6.6; }
      events.push({ id: 'rebound-review-checkpoint', message: 'The scheduled later potassium and glucose review is due after temporary shifting. Obtain new findings rather than inferring a result from an earlier ECG or assuming removal planning was delivered care.' });
      } });
    }
    // Coarse transport advances must preserve the same ordering and terminal boundary as individual ticks.
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (before !== this.clinicalState()) this.phase += 1;
    if ((this.shiftAt === null && this.removalAt === null && tick >= RENAL_HYPERKALEMIA_TAKEOVER_TICKS)
      || tick >= RENAL_HYPERKALEMIA_SESSION_TICKS) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review cardiac protection, temporary shifting, delivered removal, repeat findings, and ongoing ownership. This teaching stop predicts neither arrest nor a safe period without treatment.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalHyperkalemiaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'calcium': {
        if (this.lastCalciumAt === tick) return events;
        const before = this.clinicalState();
        this.calciumAt ??= tick; this.lastCalciumAt = tick; this.calciumRequests += 1; this.calciumExpired = false;
        if (before !== this.clinicalState()) this.phase += 1;
        return emit('calcium-care', 'Qualified calcium-salt cardiac protection is requested for the supplied ECG toxicity, with clinical review of any repeat request. No salt, dose, route, access, or automatic redosing is prescribed. The authored ECG benefit is temporary and does not lower potassium; urgent parallel care needs no administrative or laboratory-click prerequisite.');
      }
      case 'shift':
        if (this.shiftAt !== null) return events;
        this.shiftAt = tick;
        return emit('shifting-care', 'Qualified insulin-glucose shifting and hypoglycemia prevention begin using the supplied baseline glucose and individualized monitoring. No dose or infusion is selected. This temporarily redistributes potassium, does not remove it, and does not guarantee hypoglycemia or a particular response. Cardiac protection and renal care proceed in parallel.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Renal, acute-care, nursing, and pharmacy support is active. Qualified urgent cardiac protection, shifting, and removal care do not wait for an acknowledgment.');
      case 'review-context':
        if (this.contextAt !== null) return events;
        this.contextAt = tick;
        return emit('context-review', 'Review the supplied nonhemolyzed potassium, ECG toxicity, renal impairment, urine and volume context, medications, and reversible contributors. Correcting contributors and considering removal remain necessary despite an improved ECG or temporary shifting. No new specimen, renal recovery, or exclusive cause is established by this review.');
      case 'plan-removal':
        if (this.removalPlanAt !== null) return events;
        this.removalPlanAt = tick;
        return emit('removal-plan', 'The qualified renal team plans potassium removal and escalation using current kidney function, volume, ongoing losses or input, and clinical response. Dialysis urgency and any binder, diuretic, access, or modality remain individualized. A consultation or plan alone does not remove potassium.');
      case 'deliver-removal':
        if (this.removalAt !== null) return events;
        this.removalAt = tick;
        return emit('removal-care', 'Qualified delivered potassium-removal care starts, separate from planning or consultation. The lesson selects no dialysis modality, binder, diuretic, dose, access, or rate; its later partial response is fictional, not a universal onset time. Care is available independently of administrative or fresh-observation clicks.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Arrange continuous appropriate ECG surveillance plus serial potassium, glucose, renal, fluid, and bedside review. Glucose surveillance continues after insulin-glucose treatment, including after apparently reassuring values. No result is automatically obtained by arranging monitoring.');
      case 'check-ecg':
        this.ecgObservation = { atTick: tick, rhythm: this.rhythm() };
        return emit('ecg-check', `Requested qualitative teaching ECG: ${this.rhythm() === 'sinus' ? 'organized sinus pattern' : 'hyperkalemic conduction pattern'}. This is not a calibrated QRS measurement or a potassium result, and an improved ECG does not establish biochemical resolution.`);
      case 'check-glucose':
        this.glucoseObservation = { atTick: tick, glucoseMgDl: this.glucose };
        return emit('glucose-check', `Requested fictional glucose: ${this.glucose} mg/dL. This partial check leaves potassium and the last full assessment historical; it does not complete post-insulin glucose surveillance or predict later hypoglycemia.`);
      case 'reassess':
        this.observation = { atTick: tick, potassiumMmolL: this.potassium, glucoseMgDl: this.glucose,
          rhythm: this.rhythm(), ...this.vitals() };
        this.ecgObservation = { atTick: tick, rhythm: this.rhythm() };
        this.glucoseObservation = { atTick: tick, glucoseMgDl: this.glucose };
        this.observedPhase = this.phase;
        if (this.shifted && !this.removed && !this.rebound) this.shiftObserved = true;
        if (this.removed) this.removalObserved = true;
        if (this.rebound && !this.removed) this.reboundObserved = true;
        return emit(this.removed ? 'removal-reassessment' : this.rebound ? 'rebound-reassessment'
          : this.shifted ? 'shift-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: potassium ${this.potassium.toFixed(1)} mmol/L, glucose ${this.glucose} mg/dL, ${this.rhythm() === 'sinus' ? 'organized sinus pattern' : 'hyperkalemic conduction pattern'}, BP ${this.vitals().systolicMmHg}/${this.vitals().diastolicMmHg} mmHg. The patient remains awake with generalized weakness. These values do not establish full-body potassium balance, kidney recovery, durable rhythm safety, or readiness to stop surveillance.`);
      case 'ecg-resolved':
        this.ecgResolvedAttempted = true;
        return emit('ecg-resolution-refused', 'Resolution was not declared from the ECG alone. Calcium can improve conduction without lowering potassium, and temporary shifting may be followed by rebound. The attempted shortcut stays in the record without blocking later appropriate care.');
      case 'stop-glucose-monitoring':
        this.glucoseMonitoringStopAttempted = true;
        return emit('glucose-monitoring-stop-refused', 'Glucose surveillance was not stopped. Insulin-glucose treatment requires ongoing checks even after a reassuring result; no guaranteed hypoglycemia is scripted. The attempted shortcut stays in the learning record.');
      case 'handoff':
        if (this.calciumAt === null || this.shiftAt === null || this.removalAt === null || this.supportAt === null
          || this.contextAt === null || this.removalPlanAt === null || this.monitoringAt === null
          || !(this.shifted || this.removed || this.rebound) || this.observedPhase !== this.phase || this.observation === null) {
          return emit('handoff-refused', 'Record qualified cardiac protection, shifting, delivered removal and planning, support, context, surveillance, and a current full later assessment before handoff. ECG-only or glucose-only findings cannot refresh the full assessment. An earlier teaching panel or an error-free history is not required.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving qualified team owns the current observed potassium and ECG risk, delivered removal progress, repeat ECG and calcium review when indicated, ongoing potassium and post-insulin glucose checks, renal and cause-control work, and escalation. Removal may still be pending and hyperkalemia may remain unresolved. This ends the rehearsal, not monitoring, and grants no discharge clearance.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional renal hyperkalemia lesson. Nothing changed.');
    }
  }

  rhythm(): 'hyperkalemic-conduction' | 'sinus' {
    const protectedNow = this.lastCalciumAt !== null && this.tick - this.lastCalciumAt < RENAL_HYPERKALEMIA_CALCIUM_TICKS;
    // Authored branch morphology, not a potassium threshold that predicts a real ECG.
    return this.removed || (this.shifted && !this.rebound) || protectedNow ? 'sinus' : 'hyperkalemic-conduction';
  }

  vitals() {
    const toxic = this.rhythm() === 'hyperkalemic-conduction';
    const circulation = this.removed
      ? { systolicMmHg: 114, diastolicMmHg: 68, meanArterialMmHg: 83, heartRateBpm: 68, respiratoryRateBpm: 16 }
      : this.delayed && !this.shifted
        ? { systolicMmHg: 98, diastolicMmHg: 58, meanArterialMmHg: 71, heartRateBpm: toxic ? 42 : 64, respiratoryRateBpm: 20 }
        : { systolicMmHg: 110, diastolicMmHg: 64, meanArterialMmHg: 79, heartRateBpm: toxic ? 48 : 64, respiratoryRateBpm: 18 };
    return { ...circulation, spo2Percent: 98, coreTemperatureC: 36.7, alertness: 'awake with generalized weakness' };
  }

  snapshot(tick: number): RenalHyperkalemiaSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return { supportActive: this.supportAt !== null, contextReviewedAtTick: this.contextAt,
      removalPlanAtTick: this.removalPlanAt, monitoringAtTick: this.monitoringAt,
      calciumAtTick: this.calciumAt, lastCalciumAtTick: this.lastCalciumAt, calciumRequests: this.calciumRequests,
      shiftAtTick: this.shiftAt, removalAtTick: this.removalAt,
      calciumDueInSeconds: !this.ended && this.lastCalciumAt !== null && !this.calciumExpired
        ? remaining(this.lastCalciumAt, RENAL_HYPERKALEMIA_CALCIUM_TICKS) : null,
      shiftDueInSeconds: !this.ended && this.shiftAt !== null && !this.shifted
        ? remaining(this.shiftAt, RENAL_HYPERKALEMIA_SHIFT_TICKS) : null,
      removalDueInSeconds: !this.ended && this.removalAt !== null && !this.removed
        ? remaining(this.removalAt, RENAL_HYPERKALEMIA_REMOVAL_TICKS) : null,
      reboundDueInSeconds: !this.ended && this.shiftAt !== null && !this.reboundCheckpoint
        ? remaining(this.shiftAt, RENAL_HYPERKALEMIA_REBOUND_TICKS) : null,
      shiftResponseObserved: this.shiftObserved, removalResponseObserved: this.removalObserved, reboundObserved: this.reboundObserved,
      ecgResolvedAttempted: this.ecgResolvedAttempted, glucoseMonitoringStopAttempted: this.glucoseMonitoringStopAttempted,
      ecgObservation: this.ecgObservation ? { ...this.ecgObservation } : null,
      glucoseObservation: this.glucoseObservation ? { ...this.glucoseObservation } : null,
      observation: this.observation ? { ...this.observation } : null,
      alertness: this.vitals().alertness, choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
