import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { HyponatremiaCorrectionSnapshot } from '@platform/kernel/protocol';
export type { HyponatremiaCorrectionSnapshot } from '@platform/kernel/protocol';

// Authored observation contrasts, not safe waiting periods or treatment kinetics.
export const HYPONATREMIA_CORRECTION_AQUARESIS_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const HYPONATREMIA_CORRECTION_OVERCORRECTION_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const HYPONATREMIA_CORRECTION_RESPONSE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const HYPONATREMIA_CORRECTION_TAKEOVER_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const HYPONATREMIA_CORRECTION_SESSION_TICKS = 240 * 60 * TICKS_PER_SECOND;
export const HYPONATREMIA_CORRECTION_ACTIONS = ['call-support', 'review-risk', 'monitor', 'reassess',
  'control-water-loss', 'relower', 'handoff', 'normalize-now', 'wait-for-symptoms'] as const;
export type HyponatremiaCorrectionAction = typeof HYPONATREMIA_CORRECTION_ACTIONS[number];
export interface HyponatremiaCorrectionEvent { readonly id: string; readonly message: string }

export function supportsHyponatremiaCorrection(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hyponatremia-aquaresis-and-overcorrection'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'hyponatremia-correction').length === 1
    && scenario.timeline.filter((event) => event.target === 'hyponatremia-correction-boundary').length === 1;
}

/** Post-rescue qualified-team rehearsal. No dose, water-balance solver, or ODS prediction. */
export class HyponatremiaCorrection {
  private supportAt: number | null = null;
  private riskAt: number | null = null;
  private monitoringAt: number | null = null;
  private controlAt: number | null = null;
  private reloweringAt: number | null = null;
  private aquaresis = false;
  private breached = false;
  private responded = false;
  private announcedAssessmentAt: number | null = null;
  private sodium = 111;
  private urineOutput = 75;
  private aquaresisObserved = false;
  private overcorrectionObserved = false;
  private responseObserved = false;
  private peakObserved = 111;
  private normalizationAttempted = false;
  private symptomWaitChosen = false;
  private observation: HyponatremiaCorrectionSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: HyponatremiaCorrectionSnapshot['ended'] = null;

  private responseAt(): number | null {
    if (this.controlAt === null || (this.breached && this.reloweringAt === null)) return null;
    return Math.max(this.controlAt, this.reloweringAt ?? this.controlAt);
  }

  private assessmentAt(): number | null {
    if (this.controlAt === null || (this.overcorrectionObserved && this.reloweringAt === null)) return null;
    return Math.max(this.controlAt, this.reloweringAt ?? this.controlAt);
  }

  advance(tick: number): HyponatremiaCorrectionEvent[] {
    if (this.ended) return [];
    const events: HyponatremiaCorrectionEvent[] = [];
    if (!this.aquaresis && tick >= HYPONATREMIA_CORRECTION_AQUARESIS_TICKS) {
      this.aquaresis = true; this.sodium = 112; this.urineOutput = 350;
      events.push({ id: 'surveillance-checkpoint', message: 'An authored surveillance checkpoint is ready. Request fresh sodium and urine-output findings; do not wait for new neurologic symptoms. This checkpoint is not a safe monitoring interval.' });
    }
    if (!this.breached && this.controlAt === null && tick >= HYPONATREMIA_CORRECTION_OVERCORRECTION_TICKS) {
      this.breached = true; this.sodium = 115;
      // Hidden laboratory evolution must not announce a correction-limit crossing.
    }
    const responseAt = this.responseAt();
    if (!this.responded && responseAt !== null && tick - responseAt >= HYPONATREMIA_CORRECTION_RESPONSE_TICKS) {
      this.responded = true; this.sodium = 112; this.urineOutput = 100;
    }
    const assessmentAt = this.assessmentAt();
    if (assessmentAt !== null && this.announcedAssessmentAt !== assessmentAt
      && tick - assessmentAt >= HYPONATREMIA_CORRECTION_RESPONSE_TICKS) {
      this.announcedAssessmentAt = assessmentAt;
      events.push({ id: 'response-checkpoint', message: 'The scheduled authored reassessment checkpoint is ready. Request fresh findings and continue qualified sodium, urine-output, potassium, and neurologic surveillance; elapsed time alone does not establish treatment response, controlled correction, or safety.' });
    }
    if ((this.controlAt === null && tick >= HYPONATREMIA_CORRECTION_TAKEOVER_TICKS)
      || tick >= HYPONATREMIA_CORRECTION_SESSION_TICKS) {
      if (this.controlAt === null) this.sodium = 116;
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: this.controlAt === null
        ? 'Instructor takeover ends the authored branch without water-loss control. Review surveillance and response decisions. This teaching stop does not supply an unrequested laboratory result or predict neurologic injury.'
        : 'Instructor takeover ends the unfinished rehearsal. Review ongoing correction management, reassessment, and handoff. This teaching limit is not a predicted patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): HyponatremiaCorrectionEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified endocrine, renal, nursing, and monitored-care support is active. Urgent water-loss management and indicated relowering do not wait for this acknowledgment.');
      case 'review-risk':
        if (this.riskAt !== null) return events;
        this.riskAt = tick;
        return emit('risk-review', 'Preserve the original sodium of 106 mmol/L: the supplied hour-1 value of 111 already represents a rise of 5. Unknown duration, malnutrition, alcohol-use disorder, and potassium 2.7 mmol/L make excessive correction especially concerning. The selected high-risk plan uses a 4–6 mmol/L daily goal and an 8 mmol/L ceiling in any 24 hours, not a normalization target. Review withheld thiazide, potassium, nutrition, and possible causes; do not assume SIADH. Potassium treatment can contribute to sodium correction.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Qualified serial sodium, urine-output, fluid-balance, potassium, and neurologic surveillance is established. Request findings explicitly and intensify reassessment with changing water losses. Monitoring does not automatically refresh an old result.');
      case 'control-water-loss':
        if (this.controlAt !== null) return events;
        if (!this.aquaresisObserved) return emit('control-review-refused', 'Request a fresh sodium and urine-output assessment before this reactive water-loss pathway. Prophylactic clamp strategies are outside this lesson, not declared clinically wrong.');
        this.controlAt = tick;
        return emit('water-loss-control', 'Qualified management of observed water losses begins, including expert-directed desmopressin when appropriate and ongoing fluid and laboratory monitoring. No dose or route is selected. Control alone does not undo correction already achieved; reassess the trajectory against the original baseline.');
      case 'relower':
        if (this.reloweringAt !== null) return events;
        if (!this.overcorrectionObserved) return emit('relowering-review-refused', 'This selected rescue pathway needs an observed excessive correction. Obtain fresh findings; successful early prevention does not require an unnecessary relowering request.');
        this.reloweringAt = tick;
        return emit('relowering', 'Expert-directed relowering with hypotonic fluid and water-loss management is requested after observed excessive correction. Either component may be requested first; neither awaits an administrative acknowledgment. No dose, infusion rate, immediate sodium change, or guaranteed neurologic protection is implied.');
      case 'normalize-now':
        this.normalizationAttempted = true;
        return emit('normalization-refused', 'Rapid normalization was not started. Initial seizure rescue has ended and hypertonic saline is already stopped. Preserve the original correction window, reassess, and manage the observed trajectory with the qualified team. The attempted shortcut remains learning evidence.');
      case 'wait-for-symptoms':
        if (this.controlAt !== null) return emit('action-refused', 'Water-loss management is already active. Deferring its start is no longer the current choice; continue surveillance.');
        this.symptomWaitChosen = true;
        return emit('symptom-wait-choice', 'The choice to wait is retained. An awake patient can still need urgent correction surveillance; new symptoms are not required before reviewing fresh sodium and urine-output findings.');
      case 'reassess': {
        this.observation = { atTick: tick, sodiumMmolL: this.sodium, urineOutputMlPerHour: this.urineOutput, ...this.vitals() };
        if (this.aquaresis) this.aquaresisObserved = true;
        if (this.sodium - 106 > 8) this.overcorrectionObserved = true;
        if (this.responded) this.responseObserved = true;
        this.peakObserved = Math.max(this.peakObserved, this.sodium);
        return emit(this.responded ? 'response-reassessment' : this.sodium - 106 > 8 ? 'overcorrection-reassessment'
          : this.aquaresis ? 'aquaresis-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: sodium ${this.sodium} mmol/L, urine output ${this.urineOutput} mL/hour; total rise ${this.sodium - 106} mmol/L from the original 106. The patient remains awake but tired. Correction-hour ${(1 + tick / (60 * 60 * TICKS_PER_SECOND)).toFixed(2)} preserves the first hour before this rehearsal. These supplied values do not establish durable safety; continue qualified surveillance.`);
      }
      case 'handoff':
        if (this.supportAt === null || this.riskAt === null || this.monitoringAt === null
          || this.responseAt() === null || !this.responseObserved) {
          return emit('handoff-refused', 'Keep the episode open until support, high-risk and cause/potassium review, surveillance, necessary water-loss management and indicated relowering, and a fresh later response assessment are recorded. Rescue does not wait for administrative review.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving qualified team owns continuing 24–48-hour sodium, urine-output, potassium, neurologic, fluid-balance, and cause surveillance. Preserve the original 106 mmol/L baseline, all requested results, and the observed peak. This ends the rehearsal, not the correction window; no discharge clearance or guaranteed ODS prevention is established.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional sodium-correction lesson. Nothing changed.');
    }
  }

  vitals() {
    // Laboratory and urine-output values are intentionally absent from live vitals.
    return { systolicMmHg: 118, diastolicMmHg: 70, meanArterialMmHg: 86, heartRateBpm: 84,
      respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.8, alertness: 'awake but tired; no recurrent seizure is scripted' };
  }

  snapshot(tick: number): HyponatremiaCorrectionSnapshot {
    const assessmentAt = this.assessmentAt();
    return { supportActive: this.supportAt !== null, riskReviewedAtTick: this.riskAt, monitoringAtTick: this.monitoringAt,
      waterLossControlAtTick: this.controlAt, reloweringAtTick: this.reloweringAt,
      aquaresisDueInSeconds: !this.ended && !this.aquaresis
        ? Math.max(0, Math.ceil((HYPONATREMIA_CORRECTION_AQUARESIS_TICKS - tick) / TICKS_PER_SECOND)) : null,
      responseDueInSeconds: !this.ended && assessmentAt !== null && tick < assessmentAt + HYPONATREMIA_CORRECTION_RESPONSE_TICKS
        ? Math.ceil((assessmentAt + HYPONATREMIA_CORRECTION_RESPONSE_TICKS - tick) / TICKS_PER_SECOND) : null,
      aquaresisObserved: this.aquaresisObserved, overcorrectionObserved: this.overcorrectionObserved,
      responseObserved: this.responseObserved, peakObservedSodiumMmolL: this.peakObserved,
      normalizationAttempted: this.normalizationAttempted, symptomWaitChosen: this.symptomWaitChosen,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended, authoredStateTransitions: true,
      doseModelAvailable: false, durableRecoveryProven: false };
  }
}
