import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalHypokalemiaSnapshot } from '@platform/kernel/protocol';
export type { RenalHypokalemiaSnapshot } from '@platform/kernel/protocol';

// Authored observation contrasts, not replacement kinetics, required waits, or grading deadlines.
export const RENAL_HYPOKALEMIA_POTASSIUM_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOKALEMIA_MAGNESIUM_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOKALEMIA_RESPONSE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOKALEMIA_RECURRENCE_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOKALEMIA_DELAY_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOKALEMIA_TAKEOVER_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOKALEMIA_SESSION_TICKS = 360 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOKALEMIA_ACTIONS = ['potassium', 'magnesium', 'call-support', 'review-context',
  'manage-losses', 'monitor', 'check-potassium', 'check-ecg', 'reassess', 'handoff',
  'rapid-potassium', 'stop-monitoring'] as const;
export type RenalHypokalemiaAction = typeof RENAL_HYPOKALEMIA_ACTIONS[number];
export interface RenalHypokalemiaEvent { readonly id: string; readonly message: string }

export function supportsRenalHypokalemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypokalemia-magnesium-and-ongoing-losses'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-hypokalemia').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-hypokalemia-boundary').length === 1;
}

/** Potassium and magnesium replacement remain distinct from ongoing-loss care and observations. */
export class RenalHypokalemia {
  private potassiumAt: number | null = null;
  private magnesiumAt: number | null = null;
  private lossesAt: number | null = null;
  private supportAt: number | null = null;
  private contextAt: number | null = null;
  private monitoringAt: number | null = null;
  private potassiumResponded = false;
  private magnesiumResponded = false;
  private combinedCheckpoint = false;
  private recurrenceCheckpoint = false;
  private recoveryCheckpoint = false;
  private responded = false;
  private recurrent = false;
  private delayed = false;
  private potassium = 2.3;
  private magnesium = 0.40;
  private potassiumObserved = false;
  private magnesiumObserved = false;
  private responseObserved = false;
  private recurrenceObserved = false;
  private rapidPotassiumAttempted = false;
  private monitoringStopAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observation: RenalHypokalemiaSnapshot['observation'] = null;
  private potassiumObservation: RenalHypokalemiaSnapshot['potassiumObservation'] = null;
  private ecgObservation: RenalHypokalemiaSnapshot['ecgObservation'] = null;
  private feedback: string | null = null;
  private ended: RenalHypokalemiaSnapshot['ended'] = null;

  private combinedAt(): number | null {
    return this.potassiumAt !== null && this.magnesiumAt !== null ? Math.max(this.potassiumAt, this.magnesiumAt) : null;
  }
  private recoveryAt(): number | null {
    const combined = this.combinedAt();
    return combined !== null && this.lossesAt !== null && this.potassiumAt !== null
      && this.lossesAt >= this.potassiumAt + RENAL_HYPOKALEMIA_RECURRENCE_TICKS
      ? Math.max(combined, this.lossesAt) : null;
  }
  private clinicalState(): string {
    return JSON.stringify([this.potassium, this.magnesium, this.rhythm(), this.vitals()]);
  }
  private completeResponse() {
    this.responded = true; this.potassium = 3.1; this.magnesium = 0.62;
  }

  advance(tick: number): RenalHypokalemiaEvent[] {
    if (this.ended) return [];
    const before = this.clinicalState();
    const stopAt = this.potassiumAt === null ? RENAL_HYPOKALEMIA_TAKEOVER_TICKS : RENAL_HYPOKALEMIA_SESSION_TICKS;
    const until = Math.min(tick, stopAt);
    const events: RenalHypokalemiaEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.delayed && this.potassiumAt === null && until >= RENAL_HYPOKALEMIA_DELAY_TICKS) {
      due.push({ at: RENAL_HYPOKALEMIA_DELAY_TICKS, apply: () => {
        this.delayed = true;
        events.push({ id: 'clinical-deterioration', message: 'Visible pulse, pressure, and breathing findings worsen in the authored untreated-potassium contrast. Magnesium alone does not replace potassium. This clock is not a treatment deadline, a grading cutoff, or a prediction of arrhythmia.' });
      } });
    }
    if (this.potassiumAt !== null && !this.potassiumResponded && until >= this.potassiumAt + RENAL_HYPOKALEMIA_POTASSIUM_TICKS) {
      due.push({ at: this.potassiumAt + RENAL_HYPOKALEMIA_POTASSIUM_TICKS, apply: () => {
        this.potassiumResponded = true;
        if (!this.responded && !this.recurrent) this.potassium = 2.7;
        events.push({ id: 'potassium-checkpoint', message: 'The authored potassium-lane reassessment checkpoint is ready. Request current findings; potassium replacement alone does not establish magnesium correction, loss control, or durable safety. Do not defer clinical checks until a teaching clock.' });
      } });
    }
    if (this.magnesiumAt !== null && !this.magnesiumResponded && until >= this.magnesiumAt + RENAL_HYPOKALEMIA_MAGNESIUM_TICKS) {
      due.push({ at: this.magnesiumAt + RENAL_HYPOKALEMIA_MAGNESIUM_TICKS, apply: () => {
        this.magnesiumResponded = true;
        if (!this.responded) this.magnesium = 0.58;
        events.push({ id: 'magnesium-checkpoint', message: 'The authored magnesium-lane reassessment checkpoint is ready. Request current potassium and magnesium findings. Magnesium correction supports care but is not a substitute for urgent potassium replacement.' });
      } });
    }
    const combined = this.combinedAt();
    if (combined !== null && !this.combinedCheckpoint && until >= combined + RENAL_HYPOKALEMIA_RESPONSE_TICKS) {
      due.push({ at: combined + RENAL_HYPOKALEMIA_RESPONSE_TICKS, apply: () => {
        this.combinedCheckpoint = true;
        // A late magnesium request does not erase an established ongoing-loss recurrence by itself.
        if (!this.recurrent) this.completeResponse();
        events.push({ id: 'combined-checkpoint', message: 'The scheduled combined-replacement reassessment is due. Obtain current electrolytes, ECG, and bedside findings; accepted care and elapsed time do not prove sustained improvement when losses continue.' });
      } });
    }
    if (this.potassiumAt !== null && !this.recurrenceCheckpoint && until >= this.potassiumAt + RENAL_HYPOKALEMIA_RECURRENCE_TICKS) {
      due.push({ at: this.potassiumAt + RENAL_HYPOKALEMIA_RECURRENCE_TICKS, apply: () => {
        this.recurrenceCheckpoint = true;
        if (this.lossesAt === null) {
          this.recurrent = true; this.responded = false; this.potassium = 2.5;
          // Ongoing losses cannot improve magnesium when its replacement never began.
          this.magnesium = Math.min(this.magnesium, 0.46);
        }
        events.push({ id: 'losses-review-checkpoint', message: 'The scheduled ongoing-loss reassessment is due. Review current findings and delivered loss replacement and contributor care. This reminder does not disclose a laboratory result or prove that diarrhea has stopped.' });
      } });
    }
    const recovery = this.recoveryAt();
    if (recovery !== null && !this.recoveryCheckpoint && until >= recovery + RENAL_HYPOKALEMIA_RESPONSE_TICKS) {
      due.push({ at: recovery + RENAL_HYPOKALEMIA_RESPONSE_TICKS, apply: () => {
        this.recoveryCheckpoint = true; this.completeResponse();
        events.push({ id: 'recovery-checkpoint', message: 'The authored reassessment after replacement and ongoing-loss care is ready. Obtain fresh full findings; this is not complete body-store repletion, a prediction that losses have ceased, or permission to stop monitoring.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (before !== this.clinicalState()) this.phase += 1;
    if (tick >= stopAt) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends this unfinished rehearsal. Review potassium and magnesium replacement, ongoing losses, repeat findings, and receiving-team ownership. The teaching stop predicts neither arrest nor a safe period without treatment.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalHypokalemiaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'potassium':
        if (this.potassiumAt !== null) return events;
        this.potassiumAt = tick;
        return emit('potassium-care', 'Qualified monitored potassium replacement begins for the supplied severe deficit. No product, dose, concentration, access, or rate is selected. Care does not wait for magnesium, a new laboratory click, loss management, or administrative acknowledgment; magnesium and ongoing-loss care proceed alongside it.');
      case 'magnesium':
        if (this.magnesiumAt !== null) return events;
        this.magnesiumAt = tick;
        return emit('magnesium-care', 'Qualified magnesium replacement begins for the supplied deficiency, with renal and clinical monitoring. It supports correction but does not substitute for potassium. No product, dose, route, or requirement to delay potassium until magnesium is normal is prescribed.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified acute-care, nursing, pharmacy, and renal support share replacement and monitoring responsibilities. Urgent care proceeds without waiting for an acknowledgment.');
      case 'review-context':
        if (this.contextAt !== null) return events;
        this.contextAt = tick;
        return emit('context-review', 'Connect the supplied potassium and magnesium deficits, four days of diarrhea, hydrochlorothiazide exposure, weakness, and qualitative ECG findings. Review renal function, intake, volume, medications, and alternative contributors. Historical creatinine does not establish current clearance, and this review does not acquire new results.');
      case 'manage-losses':
        if (this.lossesAt !== null) return events;
        this.lossesAt = tick;
        return emit('losses-care', 'Qualified ongoing-loss replacement and contributor care are delivered, including individualized fluid, medication, and gastrointestinal review. This is not merely planning, but it does not instantly stop diarrhea or replenish potassium and magnesium by itself. No universal fluid or medication policy is selected.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Arrange appropriate ECG surveillance and serial potassium, magnesium, renal, fluid-balance, and bedside checks during replacement and continuing losses. No laboratory value or proof of rhythm safety is produced merely by arranging monitoring.');
      case 'check-potassium':
        this.potassiumObservation = { atTick: tick, potassiumMmolL: this.potassium };
        return emit('potassium-check', `Requested fictional potassium: ${this.potassium.toFixed(1)} mmol/L. This useful partial check does not refresh magnesium, the ECG, or the full bedside assessment, and does not establish complete body-store repletion.`);
      case 'check-ecg':
        this.ecgObservation = { atTick: tick, rhythm: this.rhythm() };
        return emit('ecg-check', `Requested qualitative teaching ECG: ${this.rhythm() === 'sinus' ? 'an improved organized sinus pattern' : 'organized rhythm with flattened T waves'}. This is not a measured QTc or U-wave assessment and does not supply potassium or magnesium results.`);
      case 'reassess':
        this.observation = { atTick: tick, potassiumMmolL: this.potassium, magnesiumMmolL: this.magnesium,
          rhythm: this.rhythm(), ...this.vitals() };
        this.potassiumObservation = { atTick: tick, potassiumMmolL: this.potassium };
        this.ecgObservation = { atTick: tick, rhythm: this.rhythm() };
        this.observedPhase = this.phase;
        if (!this.responded && !this.recurrent) {
          if (this.potassiumResponded) this.potassiumObserved = true;
          if (this.magnesiumResponded) this.magnesiumObserved = true;
        }
        if (this.responded) this.responseObserved = true;
        if (this.recurrent && !this.responded) this.recurrenceObserved = true;
        return emit(this.responded ? 'response-reassessment' : this.recurrent ? 'recurrence-reassessment'
          : this.potassiumResponded && this.magnesiumResponded ? 'partial-reassessment'
            : this.potassiumResponded ? 'potassium-reassessment' : this.magnesiumResponded ? 'magnesium-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: potassium ${this.potassium.toFixed(1)} mmol/L, magnesium ${this.magnesium.toFixed(2)} mmol/L, ${this.rhythm() === 'sinus' ? 'improved organized sinus pattern' : 'organized rhythm with flattened T waves'}, BP ${this.vitals().systolicMmHg}/${this.vitals().diastolicMmHg} mmHg. The patient remains awake with generalized weakness. These findings do not prove full repletion, cessation of losses, durable rhythm safety, or discharge readiness.`);
      case 'rapid-potassium':
        this.rapidPotassiumAttempted = true;
        return emit('rapid-potassium-refused', 'An unmonitored rapid-potassium shortcut was not started. This perfusing adult needs qualified replacement, appropriate delivery safeguards, and serial review; no cardiac-arrest regimen or dose is imported into this lesson. The attempted shortcut remains visible.');
      case 'stop-monitoring':
        this.monitoringStopAttempted = true;
        return emit('monitoring-stop-refused', 'Monitoring was not stopped. An improved ECG or one better potassium result does not establish magnesium correction, loss control, full repletion, or sustained safety. Earlier attempted shortcuts do not prevent later appropriate care or handoff.');
      case 'handoff':
        if (this.potassiumAt === null || this.magnesiumAt === null || this.lossesAt === null || this.supportAt === null
          || this.contextAt === null || this.monitoringAt === null || !(this.responded || this.recurrent)
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record both replacement lanes, delivered ongoing-loss care, support, context, monitoring, and a current full later response or recurrence assessment before handoff. Partial findings cannot refresh the full assessment; earlier teaching panels and an error-free history are not required.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns current potassium and magnesium deficits, replacement progress, ongoing losses and contributor care, repeat ECG and laboratory findings, and escalation. Recovery may remain pending and potassium may still be low. This closes the rehearsal, not monitoring, and certifies neither durable safety nor discharge readiness.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional renal hypokalemia lesson. Nothing changed.');
    }
  }

  rhythm(): 'hypokalemic-repolarization' | 'sinus' {
    return this.responded ? 'sinus' : 'hypokalemic-repolarization';
  }
  vitals() {
    const circulation = this.responded
      ? { systolicMmHg: 110, diastolicMmHg: 68, meanArterialMmHg: 82, heartRateBpm: 88, respiratoryRateBpm: 16 }
      : this.delayed && !this.potassiumResponded
        ? { systolicMmHg: 98, diastolicMmHg: 60, meanArterialMmHg: 73, heartRateBpm: 108, respiratoryRateBpm: 20 }
        : { systolicMmHg: 106, diastolicMmHg: 66, meanArterialMmHg: 79, heartRateBpm: 96, respiratoryRateBpm: 18 };
    return { ...circulation, spo2Percent: 98, coreTemperatureC: 36.7, alertness: 'awake with generalized weakness' };
  }

  snapshot(tick: number): RenalHypokalemiaSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    const combined = this.combinedAt(); const recovery = this.recoveryAt();
    const nextResponse = combined !== null && !this.combinedCheckpoint ? combined
      : recovery !== null && !this.recoveryCheckpoint ? recovery : null;
    return { supportActive: this.supportAt !== null, contextReviewedAtTick: this.contextAt,
      monitoringAtTick: this.monitoringAt, potassiumAtTick: this.potassiumAt, magnesiumAtTick: this.magnesiumAt,
      lossManagementAtTick: this.lossesAt,
      potassiumDueInSeconds: !this.ended && this.potassiumAt !== null && !this.potassiumResponded
        ? remaining(this.potassiumAt, RENAL_HYPOKALEMIA_POTASSIUM_TICKS) : null,
      magnesiumDueInSeconds: !this.ended && this.magnesiumAt !== null && !this.magnesiumResponded
        ? remaining(this.magnesiumAt, RENAL_HYPOKALEMIA_MAGNESIUM_TICKS) : null,
      responseDueInSeconds: !this.ended && nextResponse !== null ? remaining(nextResponse, RENAL_HYPOKALEMIA_RESPONSE_TICKS) : null,
      recurrenceDueInSeconds: !this.ended && this.potassiumAt !== null && !this.recurrenceCheckpoint
        ? remaining(this.potassiumAt, RENAL_HYPOKALEMIA_RECURRENCE_TICKS) : null,
      potassiumResponseObserved: this.potassiumObserved, magnesiumResponseObserved: this.magnesiumObserved,
      responseObserved: this.responseObserved, recurrenceObserved: this.recurrenceObserved,
      rapidPotassiumAttempted: this.rapidPotassiumAttempted, monitoringStopAttempted: this.monitoringStopAttempted,
      potassiumObservation: this.potassiumObservation ? { ...this.potassiumObservation } : null,
      ecgObservation: this.ecgObservation ? { ...this.ecgObservation } : null,
      observation: this.observation ? { ...this.observation } : null,
      alertness: this.vitals().alertness, choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
