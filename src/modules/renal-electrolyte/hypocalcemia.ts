import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalHypocalcemiaSnapshot } from '@platform/kernel/protocol';
export type { RenalHypocalcemiaSnapshot } from '@platform/kernel/protocol';

// Authored assessment contrasts, not calcium kinetics, required waits, or grading deadlines.
export const RENAL_HYPOCALCEMIA_RESCUE_TICKS = 15 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOCALCEMIA_CONTINUING_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOCALCEMIA_RECURRENCE_TICKS = 45 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOCALCEMIA_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOCALCEMIA_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOCALCEMIA_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOCALCEMIA_ACTIONS = ['rescue-calcium', 'continue-calcium', 'call-support',
  'review-context', 'monitor', 'coordinate-mineral-care', 'arrange-follow-up', 'check-ionized',
  'check-symptoms', 'reassess', 'handoff', 'trust-adjusted-total', 'oral-only', 'stop-after-relief'] as const;
export type RenalHypocalcemiaAction = typeof RENAL_HYPOCALCEMIA_ACTIONS[number];
export interface RenalHypocalcemiaEvent { readonly id: string; readonly message: string }

export function supportsRenalHypocalcemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypocalcemia-ionized-calcium-and-ckd'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-hypocalcemia').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-hypocalcemia-boundary').length === 1;
}

/** Measured ionized calcium, symptoms, continuing replacement, and longer-term care stay distinct. */
export class RenalHypocalcemia {
  private rescueAt: number | null = null;
  private continuingAt: number | null = null;
  private supportAt: number | null = null;
  private contextAt: number | null = null;
  private monitoringAt: number | null = null;
  private mineralAt: number | null = null;
  private followUpAt: number | null = null;
  private rescueResponded = false;
  private continuingResponded = false;
  private recurrenceCheckpoint = false;
  private recurrent = false;
  private delayed = false;
  private ionized = 0.86;
  private rescueObserved = false;
  private continuingObserved = false;
  private recurrenceObserved = false;
  private adjustedAttempted = false;
  private oralAttempted = false;
  private stoppedAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private ionizedObservation: RenalHypocalcemiaSnapshot['ionizedObservation'] = null;
  private symptomObservation: RenalHypocalcemiaSnapshot['symptomObservation'] = null;
  private observation: RenalHypocalcemiaSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RenalHypocalcemiaSnapshot['ended'] = null;

  private continuingStart(): number | null {
    return this.rescueAt !== null && this.continuingAt !== null ? Math.max(this.rescueAt, this.continuingAt) : null;
  }
  advance(tick: number): RenalHypocalcemiaEvent[] {
    if (this.ended) return [];
    const stopAt = this.rescueAt === null ? RENAL_HYPOCALCEMIA_TAKEOVER_TICKS : RENAL_HYPOCALCEMIA_SESSION_TICKS;
    const until = Math.min(tick, stopAt);
    const events: RenalHypocalcemiaEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (this.rescueAt === null && !this.delayed && until >= RENAL_HYPOCALCEMIA_DELAY_TICKS) {
      due.push({ at: RENAL_HYPOCALCEMIA_DELAY_TICKS, apply: () => {
        this.delayed = true; this.phase += 1;
        events.push({ id: 'clinical-deterioration', message: 'Pulse and breathing findings worsen in this authored untreated contrast. Escalate qualified assessment and calcium rescue; this teaching clock is not a safe waiting period, a grading deadline, or a prediction of arrhythmia or injury.' });
      } });
    }
    if (this.rescueAt !== null && !this.rescueResponded && until >= this.rescueAt + RENAL_HYPOCALCEMIA_RESCUE_TICKS) {
      due.push({ at: this.rescueAt + RENAL_HYPOCALCEMIA_RESCUE_TICKS, apply: () => {
        this.rescueResponded = true; this.ionized = 0.96; this.phase += 1;
        events.push({ id: 'rescue-checkpoint', message: 'The authored early calcium-rescue assessment is ready. Request ionized calcium, symptoms, and bedside findings together. Relief or elapsed time does not establish sustained correction, a normal QT interval, or permission to stop care.' });
      } });
    }
    if (this.rescueAt !== null && !this.recurrenceCheckpoint && until >= this.rescueAt + RENAL_HYPOCALCEMIA_RECURRENCE_TICKS) {
      due.push({ at: this.rescueAt + RENAL_HYPOCALCEMIA_RECURRENCE_TICKS, apply: () => {
        this.recurrenceCheckpoint = true;
        if (this.continuingAt === null) { this.recurrent = true; this.ionized = 0.88; this.phase += 1; }
        events.push({ id: 'recurrence-review-checkpoint', message: 'The scheduled continuing-care assessment is due. Review delivered calcium care, current symptoms, and requested ionized calcium rather than assuming an earlier response remains current. This reminder does not disclose a new laboratory or ECG result.' });
      } });
    }
    const continuing = this.continuingStart();
    if (continuing !== null && !this.continuingResponded && until >= continuing + RENAL_HYPOCALCEMIA_CONTINUING_TICKS) {
      due.push({ at: continuing + RENAL_HYPOCALCEMIA_CONTINUING_TICKS, apply: () => {
        this.continuingResponded = true; this.ionized = 1.03; this.phase += 1;
        events.push({ id: 'continuing-checkpoint', message: 'The authored continuing-calcium assessment is ready. Obtain current ionized calcium and bedside findings; this response is not evidence of rapid vitamin-D action, normal mineral balance, QT normalization, or durable recovery.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= stopAt) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review rescue, continuing calcium, serial measured findings, CKD mineral care, medication context, and follow-up ownership. This teaching stop does not predict a clinical outcome or establish a safe treatment delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalHypocalcemiaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'rescue-calcium':
        if (this.rescueAt !== null) return events;
        this.rescueAt = tick;
        return emit('calcium-rescue', 'Qualified monitored calcium rescue begins for the supplied symptomatic low measured ionized calcium. It does not wait for support acknowledgment, context or mineral review, or another laboratory click. No dose, concentration, access, or rate is selected.');
      case 'continue-calcium':
        if (this.continuingAt !== null) return events;
        if (this.rescueAt === null) return emit('continuing-review-refused', 'Begin urgent calcium rescue, then arrange individualized continuing calcium care immediately. There is no requirement to wait for the teaching response, a new test, or administrative review before continuing treatment.');
        this.continuingAt = tick;
        return emit('calcium-continuation', 'Qualified continuing calcium care is delivered with serial clinical and biochemical assessment. It can begin immediately after rescue, without waiting for the early teaching checkpoint or mineral and follow-up planning. No formulation, route, dose, or rate is prescribed; the modeled response belongs to calcium care, not to rapid vitamin-D action.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified acute-care, renal, endocrine, pharmacy, and nursing support share treatment, monitoring, and continuing-care responsibility. Urgent rescue proceeds without waiting for acknowledgment.');
      case 'review-context':
        if (this.contextAt !== null) return events;
        this.contextAt = tick;
        return emit('context-review', 'Review documented CKD stage 4, denosumab 21 days earlier, symptomatic measured ionized calcium, and the supplied low albumin and total-calcium discordance. The historical adjusted total does not override the measured ionized result and symptoms. Supplied pH, magnesium, phosphate, eGFR, and QTc are context, not new response measurements.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Arrange appropriate ECG and clinical surveillance with serial ionized calcium and individualized mineral and renal review. Monitoring does not generate new laboratory or QT measurements; symptoms alone and a calcium number alone are partial observations.');
      case 'coordinate-mineral-care':
        if (this.mineralAt !== null) return events;
        this.mineralAt = tick;
        return emit('mineral-care', 'Qualified renal and endocrine teams coordinate an individualized activated-vitamin-D and mineral-management plan. This does not gate urgent or continuing calcium, prescribe a regimen, normalize phosphate or renal function, or produce a modeled rapid vitamin-D response.');
      case 'arrange-follow-up':
        if (this.followUpAt !== null) return events;
        this.followUpAt = tick;
        return emit('follow-up', 'Arrange serial care beyond this rehearsal and qualified review of future denosumab decisions, including the risks of severe hypocalcemia and rebound fractures after interruption. This does not automatically restart treatment or impose permanent discontinuation; the responsible teams must individualize the plan.');
      case 'check-ionized':
        this.ionizedObservation = this.ionizedFinding(tick);
        return emit('ionized-check', `Requested fictional ionized calcium: ${this.ionized.toFixed(2)} mmol/L. This partial result does not refresh symptoms, the full bedside assessment, pH, total calcium, phosphate, renal function, or the ECG.`);
      case 'check-symptoms':
        this.symptomObservation = this.symptomFinding(tick);
        return emit('symptom-check', `Requested symptom assessment: carpopedal spasm ${this.symptomObservation.carpopedalSpasm ? 'present' : 'absent'}; perioral tingling remains present. This partial examination supplies no current calcium or QT result and does not establish sustained correction.`);
      case 'reassess':
        this.ionizedObservation = this.ionizedFinding(tick); this.symptomObservation = this.symptomFinding(tick);
        this.observation = { ...this.ionizedObservation, ...this.symptomObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.rescueResponded && !this.continuingResponded && !this.recurrent) this.rescueObserved = true;
        if (this.continuingResponded) this.continuingObserved = true;
        if (this.recurrent && !this.continuingResponded) this.recurrenceObserved = true;
        return emit(this.continuingResponded ? 'continuing-reassessment' : this.recurrent ? 'recurrence-reassessment'
          : this.rescueResponded ? 'rescue-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: ionized calcium ${this.ionized.toFixed(2)} mmol/L; carpopedal spasm ${this.observation.carpopedalSpasm ? 'present' : 'absent'}; perioral tingling persists. The patient is awake, with BP ${this.vitals().systolicMmHg}/${this.vitals().diastolicMmHg} mmHg. No new pH, total calcium, albumin, phosphate, renal, or QT response is supplied, and improvement does not prove durable correction.`);
      case 'trust-adjusted-total':
        this.adjustedAttempted = true;
        return emit('adjusted-reassurance-refused', 'Reassurance from the supplied adjusted total calcium was refused. Symptoms and the measured low ionized calcium require qualified care; the historical adjusted value does not establish safety in this CKD and low-albumin context.');
      case 'oral-only':
        this.oralAttempted = true;
        return emit('oral-only-refused', 'An oral-only substitute for urgent rescue was not started. The supplied symptomatic low ionized calcium requires qualified monitored rescue and continuing care. This does not prohibit an individualized oral component later or prescribe a route or dose.');
      case 'stop-after-relief':
        this.stoppedAttempted = true;
        return emit('relief-stop-refused', 'Calcium care and surveillance were not stopped. Early relief does not establish durable correction or resolve the denosumab and CKD mineral-care context. Earlier attempted shortcuts remain visible without preventing appropriate later treatment.');
      case 'handoff':
        if (this.rescueAt === null || this.continuingAt === null || this.supportAt === null || this.contextAt === null
          || this.monitoringAt === null || this.mineralAt === null || this.followUpAt === null || !this.rescueResponded
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record rescue, continuing calcium, support, context, surveillance, mineral-care coordination, follow-up, and a current full later response or recurrence assessment before handoff. Earlier teaching panels, normal ionized calcium, and an error-free history are not required.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns current calcium and symptoms, delivered continuing care, serial assessment, CKD mineral management, and denosumab follow-up decisions beyond this rehearsal. A continuing response may remain pending. This ends practice, not treatment, and certifies neither normal mineral balance, QT recovery, durable safety, nor discharge readiness.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional renal hypocalcemia lesson. No care was started.');
    }
  }

  private ionizedFinding(tick: number) { return { atTick: tick, ionizedCalciumMmolL: this.ionized }; }
  private symptomFinding(tick: number) {
    return { atTick: tick, carpopedalSpasm: !this.continuingResponded && (this.recurrent || !this.rescueResponded), perioralTingling: true };
  }
  rhythm(): 'sinus' { return 'sinus'; }
  vitals() {
    const response = this.continuingResponded ? { heartRateBpm: 86, respiratoryRateBpm: 18 }
      : this.recurrent ? { heartRateBpm: 104, respiratoryRateBpm: 22 }
        : this.rescueResponded ? { heartRateBpm: 90, respiratoryRateBpm: 18 }
          : this.delayed ? { heartRateBpm: 112, respiratoryRateBpm: 24 } : { heartRateBpm: 102, respiratoryRateBpm: 22 };
    return { ...response, systolicMmHg: 138, diastolicMmHg: 78, meanArterialMmHg: 98,
      spo2Percent: 98, coreTemperatureC: 36.8, alertness: 'awake' };
  }
  snapshot(tick: number): RenalHypocalcemiaSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    const continuing = this.continuingStart();
    return { supportActive: this.supportAt !== null, rescueAtTick: this.rescueAt, continuingAtTick: this.continuingAt,
      contextReviewedAtTick: this.contextAt, monitoringAtTick: this.monitoringAt, mineralCareAtTick: this.mineralAt,
      followUpAtTick: this.followUpAt,
      rescueDueInSeconds: !this.ended && this.rescueAt !== null && !this.rescueResponded ? remaining(this.rescueAt, RENAL_HYPOCALCEMIA_RESCUE_TICKS) : null,
      continuingDueInSeconds: !this.ended && continuing !== null && !this.continuingResponded ? remaining(continuing, RENAL_HYPOCALCEMIA_CONTINUING_TICKS) : null,
      rescueResponseObserved: this.rescueObserved, continuingResponseObserved: this.continuingObserved,
      recurrenceObserved: this.recurrenceObserved, adjustedReassuranceAttempted: this.adjustedAttempted,
      oralOnlyAttempted: this.oralAttempted, stoppedAfterReliefAttempted: this.stoppedAttempted,
      ionizedObservation: this.ionizedObservation ? { ...this.ionizedObservation } : null,
      symptomObservation: this.symptomObservation ? { ...this.symptomObservation } : null,
      observation: this.observation ? { ...this.observation } : null,
      alertness: this.vitals().alertness, choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
