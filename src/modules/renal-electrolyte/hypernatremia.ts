import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalHypernatremiaSnapshot } from '@platform/kernel/protocol';
export type { RenalHypernatremiaSnapshot } from '@platform/kernel/protocol';

// Authored observation contrasts, not fluid kinetics, required waits, or grading deadlines.
export const RENAL_HYPERNATREMIA_VOLUME_TICKS = 15 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERNATREMIA_WATER_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERNATREMIA_COMBINED_TICKS = 240 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERNATREMIA_RECURRENCE_TICKS = 240 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERNATREMIA_DELAY_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERNATREMIA_TAKEOVER_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERNATREMIA_SESSION_TICKS = 600 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERNATREMIA_ACTIONS = ['restore-volume', 'replace-water', 'manage-losses',
  'assist-water-access', 'call-support', 'review-context', 'monitor', 'check-sodium', 'check-fluid-balance',
  'reassess', 'handoff', 'empiric-desmopressin', 'normalize-now'] as const;
export type RenalHypernatremiaAction = typeof RENAL_HYPERNATREMIA_ACTIONS[number];
export interface RenalHypernatremiaEvent { readonly id: string; readonly message: string }

export function supportsRenalHypernatremia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypernatremia-water-access-and-losses'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-hypernatremia').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-hypernatremia-boundary').length === 1;
}

/** Circulation, water replacement, continuing losses, and reliable access are distinct care needs. */
export class RenalHypernatremia {
  private volumeAt: number | null = null;
  private waterAt: number | null = null;
  private lossesAt: number | null = null;
  private accessAt: number | null = null;
  private supportAt: number | null = null;
  private contextAt: number | null = null;
  private monitoringAt: number | null = null;
  private circulationRestored = false;
  private waterResponded = false;
  private combinedResponded = false;
  private recurrenceCheckpoint = false;
  private recurrent = false;
  private delayed = false;
  private sodium = 164;
  private volumeObserved = false;
  private waterObserved = false;
  private combinedObserved = false;
  private recurrenceObserved = false;
  private desmopressinAttempted = false;
  private normalizationAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private sodiumObservation: RenalHypernatremiaSnapshot['sodiumObservation'] = null;
  private fluidBalanceObservation: RenalHypernatremiaSnapshot['fluidBalanceObservation'] = null;
  private observation: RenalHypernatremiaSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RenalHypernatremiaSnapshot['ended'] = null;

  private combinedAt(): number | null {
    return this.waterAt !== null && this.lossesAt !== null ? Math.max(this.waterAt, this.lossesAt) : null;
  }
  advance(tick: number): RenalHypernatremiaEvent[] {
    if (this.ended) return [];
    const stopAt = this.volumeAt === null ? RENAL_HYPERNATREMIA_TAKEOVER_TICKS : RENAL_HYPERNATREMIA_SESSION_TICKS;
    const until = Math.min(tick, stopAt);
    const events: RenalHypernatremiaEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (this.volumeAt === null && !this.delayed && until >= RENAL_HYPERNATREMIA_DELAY_TICKS) {
      due.push({ at: RENAL_HYPERNATREMIA_DELAY_TICKS, apply: () => {
        this.delayed = true; this.phase += 1;
        events.push({ id: 'clinical-deterioration', message: 'Visible circulation and breathing findings worsen in this authored no-volume-restoration contrast. Escalate qualified assessment and care; this teaching clock is not a safe waiting interval, a grading deadline, or a prediction of death or neurologic injury.' });
      } });
    }
    if (this.volumeAt !== null && !this.circulationRestored && until >= this.volumeAt + RENAL_HYPERNATREMIA_VOLUME_TICKS) {
      due.push({ at: this.volumeAt + RENAL_HYPERNATREMIA_VOLUME_TICKS, apply: () => {
        this.circulationRestored = true; this.phase += 1;
        events.push({ id: 'volume-checkpoint', message: 'The authored circulation response is visible in blood pressure and pulse. Continue individualized water and continuing-loss replacement; request current sodium and fluid-balance findings. Improved circulation does not establish correction of the water deficit or new renal clearance.' });
      } });
    }
    if (this.waterAt !== null && !this.waterResponded && until >= this.waterAt + RENAL_HYPERNATREMIA_WATER_TICKS) {
      due.push({ at: this.waterAt + RENAL_HYPERNATREMIA_WATER_TICKS, apply: () => {
        this.waterResponded = true; this.sodium = 163; this.phase += 1;
        events.push({ id: 'water-checkpoint', message: 'The authored water-replacement assessment checkpoint is ready. Request current sodium and fluid-balance findings. Treatment requests and elapsed time do not establish normalization, adequate replacement of continuing losses, or reliable access after transfer.' });
      } });
    }
    if (this.waterAt !== null && !this.recurrenceCheckpoint && until >= this.waterAt + RENAL_HYPERNATREMIA_RECURRENCE_TICKS) {
      due.push({ at: this.waterAt + RENAL_HYPERNATREMIA_RECURRENCE_TICKS, apply: () => {
        this.recurrenceCheckpoint = true;
        if (this.lossesAt === null) { this.recurrent = true; this.sodium = 164; this.phase += 1; }
        events.push({ id: 'losses-review-checkpoint', message: 'The scheduled continuing-loss assessment is due. Review current sodium, fluid balance, diarrhea, and delivered replacement rather than assuming an earlier result remains current. This reminder does not disclose a new laboratory finding or mean diarrhea has ceased.' });
      } });
    }
    const combined = this.combinedAt();
    if (combined !== null && !this.combinedResponded && until >= combined + RENAL_HYPERNATREMIA_COMBINED_TICKS) {
      due.push({ at: combined + RENAL_HYPERNATREMIA_COMBINED_TICKS, apply: () => {
        this.combinedResponded = true; this.sodium = 162; this.phase += 1;
        events.push({ id: 'combined-checkpoint', message: 'The authored combined water and continuing-loss care assessment is ready. Obtain current findings and continue clinical surveillance; this does not prove normal sodium, cessation of diarrhea, durable hydration, or discharge readiness.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= stopAt) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review circulation, water deficit, continuing losses, safe assisted access, serial findings, and receiving-team ownership. This teaching stop predicts neither clinical injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalHypernatremiaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'restore-volume':
        if (this.volumeAt !== null) return events;
        this.volumeAt = tick;
        return emit('volume-restoration', 'Qualified restoration of depleted circulation begins with appropriate isotonic fluid and bedside reassessment. It does not wait for support, contributor review, water-access arrangements, or a new laboratory click. No dose, fluid volume, or rate is selected.');
      case 'replace-water':
        if (this.waterAt !== null) return events;
        if (!this.circulationRestored) return emit('water-review-refused', 'Restore depleted circulation first in this selected hypovolemic branch, then coordinate individualized water-deficit replacement. The visible circulation response unlocks care without a new laboratory or administrative prerequisite; the authored interval is not a required clinical wait.');
        this.waterAt = tick;
        return emit('water-replacement', 'Qualified individualized water-deficit replacement begins after circulation restoration, using a safe appropriate route and serial clinical and sodium review. Ongoing losses require their own replacement. Assistance, support, and context acknowledgment do not gate the biochemical response; no prescription or normalization promise is supplied.');
      case 'manage-losses':
        if (this.lossesAt !== null) return events;
        if (!this.circulationRestored) return emit('losses-review-refused', 'Prioritize restoration of the depleted circulation, then deliver individualized replacement of continuing losses with reassessment. No new test, support acknowledgment, or water-access action is required.');
        this.lossesAt = tick;
        return emit('losses-care', 'Qualified replacement of continuing fluid and electrolyte losses and contributor care is delivered. It is not merely a plan and does not instantly stop diarrhea or replace the existing water deficit by itself. No volume, composition, or rate is prescribed.');
      case 'assist-water-access':
        if (this.accessAt !== null) return events;
        this.accessAt = tick;
        return emit('water-access', 'Safe route and physical-access support is put in place: individualized assistance, reachable supplies when appropriate, and a reliable alternative when drinking is unsafe or insufficient. This is delivered support, not an assumption of independence or a forced oral route. It does not by itself quantify or correct the established deficit.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified acute-care, renal, and nursing support share circulation, water-balance, access, and surveillance responsibilities. Immediate circulation care does not wait for acknowledgment.');
      case 'review-context':
        if (this.contextAt !== null) return events;
        this.contextAt = tick;
        return emit('context-review', 'Review limited assisted water access, three days of diarrhea, the supplied sodium 164 mmol/L, concentrated pretreatment urine, and unknown hypernatremia duration. There is no established AVP deficiency or desmopressin prescription. Historical urine results do not certify current renal function or determine the route and rate of replacement.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Arrange repeated sodium, intake and output, continuing losses, circulation, neurologic, and clinical review. Adapt qualified replacement to observed trends and safe access. A monitoring request does not produce a laboratory result or prove a safe correction rate.');
      case 'check-sodium':
        this.sodiumObservation = this.sodiumFinding(tick);
        return emit('sodium-check', `Requested fictional sodium: ${this.sodium} mmol/L; change from the original 164 baseline: ${this.sodium - 164} mmol/L. This partial check does not refresh fluid balance, continuing losses, or the full bedside assessment.`);
      case 'check-fluid-balance':
        this.fluidBalanceObservation = this.balanceFinding(tick);
        return emit('fluid-balance-check', `Requested fictional fluid-balance assessment: urine output ${this.fluidBalanceObservation.urineOutputMlPerHour} mL/hour; diarrhea remains present. This partial finding does not refresh sodium, quantify stool losses, or establish current urine concentration or renal clearance.`);
      case 'reassess':
        this.sodiumObservation = this.sodiumFinding(tick); this.fluidBalanceObservation = this.balanceFinding(tick);
        this.observation = { ...this.sodiumObservation, ...this.fluidBalanceObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.circulationRestored) this.volumeObserved = true;
        if (this.waterResponded && !this.combinedResponded && !this.recurrent) this.waterObserved = true;
        if (this.combinedResponded) this.combinedObserved = true;
        if (this.recurrent && !this.combinedResponded) this.recurrenceObserved = true;
        return emit(this.combinedResponded ? 'combined-reassessment' : this.recurrent ? 'recurrence-reassessment'
          : this.waterResponded ? 'water-reassessment' : this.circulationRestored ? 'volume-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: sodium ${this.sodium} mmol/L (${this.sodium - 164} from the original 164 baseline), urine output ${this.observation.urineOutputMlPerHour} mL/hour, diarrhea still present, BP ${this.vitals().systolicMmHg}/${this.vitals().diastolicMmHg} mmHg. The patient remains awake, thirsty, and fatigued. No new urine osmolality, creatinine, clearance, normalized sodium, or durable recovery is established.`);
      case 'empiric-desmopressin':
        this.desmopressinAttempted = true;
        return emit('desmopressin-refused', 'Empiric desmopressin was not started. This selected water-access and diarrheal-loss presentation supplies concentrated urine and no established AVP deficiency or prescribed replacement indication. Review causes and water balance rather than importing the separate known-AVP-deficiency pathway; this is not a universal contraindication.');
      case 'normalize-now':
        this.normalizationAttempted = true;
        return emit('normalization-refused', 'Blind sodium normalization was not started. Duration is uncertain, and qualified correction requires serial findings and individualized deficit and continuing-loss replacement. The model does not prescribe a universal rate or predict neurologic injury.');
      case 'handoff':
        if (this.volumeAt === null || this.waterAt === null || this.lossesAt === null || this.accessAt === null
          || this.supportAt === null || this.contextAt === null || this.monitoringAt === null || !this.waterResponded
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record circulation, delivered water and continuing-loss replacement, safe access support, context, monitoring, and a current full later water-response or recurrence assessment before handoff. Normal sodium, all earlier teaching panels, and an error-free history are not required.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns residual hypernatremia, continuing diarrhea and replacement, safe assisted water access, serial sodium and fluid-balance findings, and escalation. Combined-care recovery may remain pending. This closes rehearsal, not care, and does not establish normal sodium, new renal clearance, or discharge readiness.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional renal hypernatremia lesson. No care was started.');
    }
  }

  private sodiumFinding(tick: number) { return { atTick: tick, sodiumMmolL: this.sodium, changeFromBaselineMmolL: this.sodium - 164 }; }
  private balanceFinding(tick: number) { return { atTick: tick, urineOutputMlPerHour: this.circulationRestored ? 35 : 20, ongoingDiarrhea: true }; }
  rhythm(): 'sinus' { return 'sinus'; }
  vitals() {
    const circulation = this.circulationRestored
      ? { systolicMmHg: 108, diastolicMmHg: 66, meanArterialMmHg: 80, heartRateBpm: 94, respiratoryRateBpm: 18 }
      : this.delayed
        ? { systolicMmHg: 78, diastolicMmHg: 44, meanArterialMmHg: 55, heartRateBpm: 124, respiratoryRateBpm: 22 }
        : { systolicMmHg: 88, diastolicMmHg: 52, meanArterialMmHg: 64, heartRateBpm: 112, respiratoryRateBpm: 20 };
    return { ...circulation, spo2Percent: 98, coreTemperatureC: 37.1, alertness: 'awake, thirsty, and fatigued' };
  }
  snapshot(tick: number): RenalHypernatremiaSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    const combined = this.combinedAt();
    return { supportActive: this.supportAt !== null, volumeAtTick: this.volumeAt, waterAtTick: this.waterAt,
      lossManagementAtTick: this.lossesAt, waterAccessAtTick: this.accessAt, contextReviewedAtTick: this.contextAt,
      monitoringAtTick: this.monitoringAt,
      volumeDueInSeconds: !this.ended && this.volumeAt !== null && !this.circulationRestored ? remaining(this.volumeAt, RENAL_HYPERNATREMIA_VOLUME_TICKS) : null,
      waterDueInSeconds: !this.ended && this.waterAt !== null && !this.waterResponded ? remaining(this.waterAt, RENAL_HYPERNATREMIA_WATER_TICKS) : null,
      combinedDueInSeconds: !this.ended && combined !== null && !this.combinedResponded ? remaining(combined, RENAL_HYPERNATREMIA_COMBINED_TICKS) : null,
      circulationRestored: this.circulationRestored, volumeObserved: this.volumeObserved, waterResponseObserved: this.waterObserved,
      combinedResponseObserved: this.combinedObserved, recurrenceObserved: this.recurrenceObserved,
      empiricDesmopressinAttempted: this.desmopressinAttempted, normalizationAttempted: this.normalizationAttempted,
      sodiumObservation: this.sodiumObservation ? { ...this.sodiumObservation } : null,
      fluidBalanceObservation: this.fluidBalanceObservation ? { ...this.fluidBalanceObservation } : null,
      observation: this.observation ? { ...this.observation } : null,
      alertness: this.vitals().alertness, choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
