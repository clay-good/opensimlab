import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { PerioperativeDiabetesSnapshot } from '@platform/kernel/protocol';
export type { PerioperativeDiabetesSnapshot } from '@platform/kernel/protocol';

// Fictional observation contrasts, not insulin kinetics, required waits, or grading deadlines.
export const PERIOPERATIVE_DIABETES_EARLY_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const PERIOPERATIVE_DIABETES_RESPONSE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const PERIOPERATIVE_DIABETES_DELAY_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const PERIOPERATIVE_DIABETES_WORSENING_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const PERIOPERATIVE_DIABETES_TAKEOVER_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const PERIOPERATIVE_DIABETES_SESSION_TICKS = 240 * 60 * TICKS_PER_SECOND;
export const PERIOPERATIVE_DIABETES_ACTIONS = ['restore-insulin', 'call-support', 'review-context',
  'plan-fasting', 'monitor', 'check-glucose', 'reassess', 'handoff', 'omit-insulin', 'cgm-only', 'clear-surgery'] as const;
export type PerioperativeDiabetesAction = typeof PERIOPERATIVE_DIABETES_ACTIONS[number];
export interface PerioperativeDiabetesEvent { readonly id: string; readonly message: string }

export function supportsPerioperativeDiabetes(scenario: Scenario): boolean {
  return scenario.metadata.id === 'perioperative-diabetes-insulin-continuity'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'perioperative-diabetes').length === 1
    && scenario.timeline.filter((event) => event.target === 'perioperative-diabetes-boundary').length === 1;
}

/** Insulin continuity during disrupted fasting; no dose, pump, acid-base, or surgical-clearance model. */
export class PerioperativeDiabetes {
  private insulinAt: number | null = null;
  private supportAt: number | null = null;
  private contextAt: number | null = null;
  private fastingPlanAt: number | null = null;
  private monitoringAt: number | null = null;
  private delayed = false;
  private worsened = false;
  private earlyResponded = false;
  private responded = false;
  private glucose = 180;
  private ketones = 0.6;
  private earlyObserved = false;
  private responseObserved = false;
  private deteriorationObserved = false;
  private omissionAttempted = false;
  private cgmOnlyAttempted = false;
  private clearanceAttempted = false;
  private glucoseObservation: PerioperativeDiabetesSnapshot['glucoseObservation'] = null;
  private observation: PerioperativeDiabetesSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: PerioperativeDiabetesSnapshot['ended'] = null;

  advance(tick: number): PerioperativeDiabetesEvent[] {
    if (this.ended) return [];
    const events: PerioperativeDiabetesEvent[] = [];
    if (this.insulinAt === null && !this.delayed && tick >= PERIOPERATIVE_DIABETES_DELAY_TICKS) {
      this.delayed = true; this.glucose = 240; this.ketones = 1.2;
      events.push({ id: 'clinical-deterioration', message: 'Pulse and respiratory rate rise in this authored insulin-interruption contrast. Restore reliable qualified coverage and obtain fresh findings. This clock is not a treatment deadline or a grading cutoff.' });
    }
    if (this.insulinAt === null && !this.worsened && tick >= PERIOPERATIVE_DIABETES_WORSENING_TICKS) {
      this.worsened = true; this.glucose = 280; this.ketones = 2.0;
      events.push({ id: 'clinical-worsening', message: 'Visible pulse and breathing changes persist during the fictional interruption. Escalate assessment and insulin continuity; no new laboratory result or diagnosis of ketoacidosis is supplied by this alert.' });
    }
    if (this.insulinAt !== null && !this.earlyResponded && tick - this.insulinAt >= PERIOPERATIVE_DIABETES_EARLY_TICKS) {
      this.earlyResponded = true; this.glucose = this.delayed ? 198 : 162; this.ketones = this.delayed ? 1.0 : 0.4;
      events.push({ id: 'early-checkpoint', message: 'The first authored observation checkpoint is ready. Request glucose, ketones, and bedside reassessment. Accepted insulin coverage does not establish biochemical response, and this is not an instruction to defer clinical checks until the teaching clock.' });
    }
    if (this.insulinAt !== null && !this.responded && tick - this.insulinAt >= PERIOPERATIVE_DIABETES_RESPONSE_TICKS) {
      this.responded = true; this.glucose = this.delayed ? 162 : 144; this.ketones = this.delayed ? 0.4 : 0.3;
      events.push({ id: 'response-checkpoint', message: 'The later authored reassessment checkpoint is ready. Obtain fresh findings and review continued insulin, fasting, and monitoring ownership. The clock does not prove recovery or readiness for anesthesia or surgery.' });
    }
    if ((this.insulinAt === null && tick >= PERIOPERATIVE_DIABETES_TAKEOVER_TICKS) || tick >= PERIOPERATIVE_DIABETES_SESSION_TICKS) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: this.insulinAt === null
        ? 'Instructor takeover ends this branch without restored insulin coverage. This teaching stop does not predict ketoacidosis, injury, or a safe duration of insulin interruption.'
        : 'Instructor takeover ends the unfinished rehearsal. Review ongoing insulin, fasting, monitoring, and postoperative ownership; this is not a clinical outcome or discharge decision.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): PerioperativeDiabetesEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'restore-insulin':
        if (this.insulinAt !== null) return events;
        this.insulinAt = tick;
        return emit('insulin-restored', 'Qualified staff establish verified alternative insulin coverage for type 1 diabetes while fasting. This does not blindly restart the unreliable pump or prescribe a formulation, dose, route, or infusion rate. Coverage does not wait for a new laboratory click, support acknowledgment, or fasting-plan review.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Diabetes, anesthesia, surgical, nursing, and pharmacy support share responsibility for the interrupted insulin pathway. Urgent coverage proceeds while communication is arranged.');
      case 'review-context':
        if (this.contextAt !== null) return events;
        this.contextAt = tick;
        return emit('context-review', 'Connect known type 1 diabetes, the interrupted pump without long-acting backup, the delayed operation and missed meals, prior insulin delivery, and supplied historical blood results. Those earlier acid-base and electrolyte values are not current proof that ketoacidosis is absent.');
      case 'plan-fasting':
        if (this.fastingPlanAt !== null) return events;
        this.fastingPlanAt = tick;
        return emit('fasting-plan', 'The qualified team individualizes fasting, insulin and glucose-substrate coordination, fluid and electrolyte review, theatre timing, and postoperative intake or continued fasting. No universal dextrose rule, oral intake permission, insulin dose, or surgical clearance is supplied; reviewing the plan does not itself lower glucose or ketones.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Arrange serial point-of-care glucose, ketone and bedside review, with qualified acid-base and electrolyte assessment when indicated. Recheck after changes in intake or insulin delivery. Continuous glucose monitoring may supplement, not replace, the required perioperative checks; no fresh result is generated by this request.');
      case 'check-glucose':
        this.glucoseObservation = { atTick: tick, glucoseMgDl: this.glucose };
        return emit('glucose-check', `Requested fictional glucose: ${this.glucose} mg/dL. This useful partial check does not measure ketones, update the full bedside assessment, establish acid-base status, or authorize surgery.`);
      case 'reassess':
        this.glucoseObservation = { atTick: tick, glucoseMgDl: this.glucose };
        this.observation = { atTick: tick, glucoseMgDl: this.glucose, ketonesMmolL: this.ketones, ...this.vitals() };
        if (this.earlyResponded && !this.responded) this.earlyObserved = true;
        if (this.responded) this.responseObserved = true;
        if (this.delayed && !this.earlyResponded && !this.responded) this.deteriorationObserved = true;
        return emit(this.responded ? 'response-reassessment' : this.earlyResponded ? 'early-response-reassessment'
          : this.delayed ? 'deterioration-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: glucose ${this.glucose} mg/dL, blood ketones ${this.ketones.toFixed(1)} mmol/L; pulse ${this.vitals().heartRateBpm}/min, respiratory rate ${this.vitals().respiratoryRateBpm}/min. The patient remains awake and thirsty. No new acid-base result, DKA exclusion or resolution, safe pump operation, or surgical clearance is established.`);
      case 'omit-insulin':
        this.omissionAttempted = true;
        return emit('insulin-omission-refused', 'All insulin was not withheld solely because the patient is fasting. Type 1 diabetes needs individualized basal coverage even without meals; that does not mean every meal bolus or an unchanged usual dose must be given. The attempted shortcut stays in the learning record.');
      case 'cgm-only':
        this.cgmOnlyAttempted = true;
        return emit('cgm-only-refused', 'Required point-of-care and clinical surveillance was not replaced with CGM alone. Sensor glucose cannot establish ketones, acid-base status, or reliable insulin delivery. CGM may still be used as a qualified adjunct.');
      case 'clear-surgery':
        this.clearanceAttempted = true;
        return emit('clearance-refused', 'Automatic surgical clearance was not issued. One glucose result or an authored response cannot decide readiness for anesthesia, the cause of deterioration, or postoperative insulin and intake safety. The qualified perioperative team owns that decision.');
      case 'handoff':
        if (this.insulinAt === null || this.supportAt === null || this.contextAt === null || this.fastingPlanAt === null
          || this.monitoringAt === null || !this.responseObserved) {
          return emit('handoff-refused', 'Keep the episode open until reliable insulin coverage, support, context, an individualized fasting plan, surveillance, and a fresh later full assessment are recorded. An earlier teaching assessment or an error-free history is not required to hand off current care.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns verified insulin continuity, repeat glucose and ketone or additional biochemical checks as indicated, individualized intake and glucose-substrate coordination, and postoperative transition planning. Prior choices remain visible. This closes the rehearsal, not the need for monitoring, and grants no surgical or discharge clearance.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional perioperative diabetes lesson. Nothing changed.');
    }
  }

  vitals() {
    const [heartRateBpm, respiratoryRateBpm] = this.responded ? [88, 16]
      : this.earlyResponded ? (this.delayed ? [92, 18] : [88, 16])
        : this.worsened ? [104, 20] : this.delayed ? [96, 18] : [88, 16];
    return { systolicMmHg: 118, diastolicMmHg: 72, meanArterialMmHg: 87,
      heartRateBpm: heartRateBpm!, respiratoryRateBpm: respiratoryRateBpm!,
      spo2Percent: 98, coreTemperatureC: 36.7, alertness: 'awake and thirsty' };
  }

  snapshot(tick: number): PerioperativeDiabetesSnapshot {
    return { supportActive: this.supportAt !== null, contextReviewedAtTick: this.contextAt,
      fastingPlanAtTick: this.fastingPlanAt, monitoringAtTick: this.monitoringAt, insulinAtTick: this.insulinAt,
      earlyDueInSeconds: !this.ended && this.insulinAt !== null && !this.earlyResponded
        ? Math.max(0, Math.ceil((this.insulinAt + PERIOPERATIVE_DIABETES_EARLY_TICKS - tick) / TICKS_PER_SECOND)) : null,
      responseDueInSeconds: !this.ended && this.insulinAt !== null && !this.responded
        ? Math.max(0, Math.ceil((this.insulinAt + PERIOPERATIVE_DIABETES_RESPONSE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      earlyResponseObserved: this.earlyObserved, responseObserved: this.responseObserved,
      deteriorationObserved: this.deteriorationObserved, omitInsulinAttempted: this.omissionAttempted,
      cgmOnlyAttempted: this.cgmOnlyAttempted, clearanceAttempted: this.clearanceAttempted,
      glucoseObservation: this.glucoseObservation ? { ...this.glucoseObservation } : null,
      observation: this.observation ? { ...this.observation } : null,
      alertness: this.vitals().alertness, choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
