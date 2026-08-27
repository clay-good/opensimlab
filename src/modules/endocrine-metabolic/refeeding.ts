import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';

import type { RefeedingSnapshot } from '@platform/kernel/protocol';
export type { RefeedingSnapshot } from '@platform/kernel/protocol';

// Authored observation contrasts, not replacement kinetics, required waits, or grading deadlines.
export const REFEEDING_ELECTROLYTE_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const REFEEDING_RECURRENCE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const REFEEDING_RESPONSE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const REFEEDING_DELAY_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const REFEEDING_TAKEOVER_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const REFEEDING_SESSION_TICKS = 240 * 60 * TICKS_PER_SECOND;
export const REFEEDING_ACTIONS = ['call-support', 'review-context', 'monitor', 'thiamine',
  'replace-electrolytes', 'review-nutrition', 'phosphate-only', 'reassess', 'handoff',
  'advance-feeding', 'stop-monitoring'] as const;
export type RefeedingAction = typeof REFEEDING_ACTIONS[number];
export interface RefeedingEvent { readonly id: string; readonly message: string }

export function supportsRefeeding(scenario: Scenario): boolean {
  return scenario.metadata.id === 'refeeding-electrolyte-shift'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'refeeding').length === 1
    && scenario.timeline.filter((event) => event.target === 'refeeding-boundary').length === 1;
}

/** Established feeding-related concern; no nutritional prescription, electrolyte solver, or injury prediction. */
export class Refeeding {
  private supportAt: number | null = null;
  private contextAt: number | null = null;
  private monitoringAt: number | null = null;
  private thiamineAt: number | null = null;
  private phosphateAt: number | null = null;
  private completeAt: number | null = null;
  private nutritionAt: number | null = null;
  private delayed = false;
  private phosphateResponded = false;
  private electrolytesResponded = false;
  private recurrent = false;
  private recurrenceCheckpointAnnounced = false;
  private responded = false;
  private phosphate = 0.30;
  private potassium = 2.7;
  private magnesium = 0.48;
  private electrolytesObserved = false;
  private responseObserved = false;
  private recurrenceObserved = false;
  private feedingAdvanceAttempted = false;
  private monitoringStopAttempted = false;
  private observation: RefeedingSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RefeedingSnapshot['ended'] = null;

  private responseAt(): number | null {
    return this.completeAt !== null && this.nutritionAt !== null ? Math.max(this.completeAt, this.nutritionAt) : null;
  }

  advance(tick: number): RefeedingEvent[] {
    if (this.ended) return [];
    const events: RefeedingEvent[] = [];
    if (!this.delayed && this.completeAt === null && this.phosphateAt === null && tick >= REFEEDING_DELAY_TICKS) {
      this.delayed = true; this.phosphate = 0.22; this.potassium = 2.5; this.magnesium = 0.42;
      events.push({ id: 'clinical-deterioration', message: 'Visible circulatory and respiratory signs worsen in this authored untreated contrast. Escalate qualified care and obtain fresh findings. The clock is not a clinical deadline or a grading cutoff; no arrhythmia, edema, or injury is predicted.' });
    }
    if (!this.phosphateResponded && this.phosphateAt !== null && tick - this.phosphateAt >= REFEEDING_ELECTROLYTE_TICKS) {
      this.phosphateResponded = true;
      if (!this.electrolytesResponded) this.phosphate = 0.45;
      events.push({ id: 'phosphate-checkpoint', message: 'The authored phosphate-focused observation checkpoint is ready. Request all electrolyte findings rather than assuming the remaining deficits or clinical risks have resolved. This is not a replacement-rate model.' });
    }
    if (!this.electrolytesResponded && this.completeAt !== null && tick - this.completeAt >= REFEEDING_ELECTROLYTE_TICKS) {
      this.electrolytesResponded = true; this.phosphate = 0.50; this.potassium = 3.1; this.magnesium = 0.60;
      events.push({ id: 'electrolyte-checkpoint', message: 'The authored complete-electrolyte observation checkpoint is ready. Obtain fresh findings and continue qualified nutritional and vitamin care. Accepted replacement does not establish normalization or sustained response.' });
    }
    if (this.completeAt !== null && tick - this.completeAt >= REFEEDING_RECURRENCE_TICKS) {
      if (!this.recurrenceCheckpointAnnounced) {
        this.recurrenceCheckpointAnnounced = true;
        events.push({ id: 'nutrition-reassessment-checkpoint', message: 'A scheduled authored nutrition and electrolyte reassessment is due. Review current findings and the individualized feeding plan. This reminder does not disclose a laboratory result or prove that a particular feeding strategy prevents further decline.' });
      }
      if (!this.recurrent && this.nutritionAt === null) {
        this.recurrent = true; this.phosphate = 0.35; this.potassium = 2.8; this.magnesium = 0.50;
      }
    }
    const responseAt = this.responseAt();
    if (!this.responded && responseAt !== null && tick - responseAt >= REFEEDING_RESPONSE_TICKS) {
      this.responded = true; this.phosphate = 0.55; this.potassium = 3.3; this.magnesium = 0.65;
      events.push({ id: 'response-checkpoint', message: 'The authored combined-care checkpoint is ready for fresh reassessment. It is not proof of normalized electrolytes, thiamine sufficiency, safe feeding advancement, or lasting stability. Continue qualified monitoring rather than waiting for a teaching clock when the patient worsens.' });
    }
    if ((this.completeAt === null && tick >= REFEEDING_TAKEOVER_TICKS) || tick >= REFEEDING_SESSION_TICKS) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: this.completeAt === null
        ? 'Instructor takeover ends this branch without a complete electrolyte-care plan. Phosphate-focused care alone does not address the supplied potassium and magnesium deficits. This teaching stop is not a predicted clinical outcome.'
        : 'Instructor takeover ends the unfinished rehearsal. Review continued electrolyte, nutrition, vitamin, clinical, and team responsibilities. No patient injury or discharge outcome is inferred from the teaching limit.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RefeedingEvent[] {
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
        return emit('support', 'Qualified medical, nutrition, nursing, pharmacy, and monitored-care support is active. Urgent treatment does not wait for an acknowledgment.');
      case 'review-context':
        if (this.contextAt !== null) return events;
        this.contextAt = tick;
        return emit('context-review', 'Review prolonged poor intake, the supplied electrolyte decline after 30 hours of enteral nutrition, all carbohydrate sources including intravenous dextrose, and renal, fluid, medication, and alternative-cause context. The feeding-related concern is supplied; a low phosphate alone does not prove its cause.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Qualified serial phosphate, potassium, magnesium, glucose, renal, fluid-balance, neurologic, and cardiorespiratory surveillance is arranged. Use monitored care appropriate to the severe deficits; checks remain necessary as nutrition and replacement change. No automatic new laboratory result is supplied.');
      case 'thiamine':
        if (this.thiamineAt !== null) return events;
        this.thiamineAt = tick;
        return emit('thiamine', 'Qualified thiamine and appropriate multivitamin care begins alongside urgent electrolyte and nutrition management, without waiting for a thiamine assay. No dose, route, established deficiency, instant biochemical effect, or neurologic recovery is modeled.');
      case 'replace-electrolytes':
        if (this.completeAt !== null) return events;
        this.completeAt = tick;
        return emit('electrolyte-replacement', 'Qualified replacement and monitoring of the supplied phosphate, potassium, and magnesium deficits begins. Individualize preparation, route, rate, renal safety, and repeat checks; none is prescribed here. Treatment is available without a new laboratory click, support acknowledgment, nutrition request, or thiamine prerequisite.');
      case 'review-nutrition':
        if (this.nutritionAt !== null) return events;
        this.nutritionAt = tick;
        return emit('nutrition-review', 'The qualified team reassesses nutrition, all dextrose sources, fluid balance, and further advancement while treating the established electrolyte deterioration. The individualized plan may slow advancement or adjust provision; it does not impose a universal stop-feeding rule or numerical calorie prescription. Electrolyte and vitamin care proceed independently.');
      case 'phosphate-only':
        if (this.phosphateAt !== null) return events;
        if (this.completeAt !== null) return emit('action-refused', 'Complete electrolyte care already includes phosphate. A duplicate phosphate-focused request is not an additional treatment in this lesson.');
        this.phosphateAt = tick;
        return emit('phosphate-only', 'Qualified phosphate-focused care is accepted as a partial step, not an error by itself. It does not complete the potassium and magnesium plan. Continue comprehensive replacement and surveillance; no preparation or dose is selected.');
      case 'advance-feeding':
        this.feedingAdvanceAttempted = true;
        return emit('feeding-advance-refused', 'Automatic feeding advancement was not started. The supplied deterioration and current response need individualized nutritional and clinical review; accepted care or one better result does not establish safe progression. This refusal is not a universal requirement to stop all nutrition.');
      case 'stop-monitoring':
        this.monitoringStopAttempted = true;
        return emit('monitoring-stop-refused', 'Surveillance was not stopped. Electrolytes, replacement needs, feeding tolerance, and clinical risk require continuing review. The attempted shortcut remains visible without preventing later appropriate care or handoff.');
      case 'reassess': {
        this.observation = { atTick: tick, phosphateMmolL: this.phosphate, potassiumMmolL: this.potassium,
          magnesiumMmolL: this.magnesium, ...this.vitals() };
        if (!this.responded && !this.recurrent && (this.phosphateResponded || this.electrolytesResponded)) this.electrolytesObserved = true;
        if (this.recurrent && !this.responded) this.recurrenceObserved = true;
        if (this.responded) this.responseObserved = true;
        return emit(this.responded ? 'response-reassessment' : this.recurrent ? 'recurrent-reassessment'
          : this.electrolytesResponded ? 'complete-electrolyte-reassessment'
            : this.phosphateResponded ? 'electrolyte-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: phosphate ${this.phosphate.toFixed(2)} mmol/L, potassium ${this.potassium.toFixed(1)} mmol/L, magnesium ${this.magnesium.toFixed(2)} mmol/L; BP ${this.vitals().systolicMmHg}/${this.vitals().diastolicMmHg} mmHg. The patient remains awake with generalized weakness. These authored findings do not establish full-body repletion, corrected vitamin status, or readiness to advance nutrition without qualified review.`);
      }
      case 'handoff':
        if (this.supportAt === null || this.contextAt === null || this.monitoringAt === null || this.thiamineAt === null
          || this.responseAt() === null || !this.responseObserved) {
          return emit('handoff-refused', 'Keep the episode open until qualified support, context, surveillance, vitamin care, complete electrolyte replacement, individualized nutrition review, and a fresh combined-care assessment are recorded. An earlier teaching observation or a flawless history is not required to hand off current care.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns continued electrolyte and renal checks, cardiorespiratory and fluid surveillance, thiamine and multivitamin care, and individualized nutritional progression. Prior choices and observed recurrence stay in the record. This ends the rehearsal, not the refeeding-risk period or need for supplementation; no discharge clearance is implied.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional refeeding lesson. Nothing changed.');
    }
  }

  vitals() {
    const circulation = this.responded
      ? { systolicMmHg: 110, diastolicMmHg: 68, meanArterialMmHg: 82, heartRateBpm: 94, respiratoryRateBpm: 18 }
      : this.recurrent
        ? { systolicMmHg: 102, diastolicMmHg: 64, meanArterialMmHg: 77, heartRateBpm: 112, respiratoryRateBpm: 22 }
        : this.electrolytesResponded
          ? { systolicMmHg: 106, diastolicMmHg: 66, meanArterialMmHg: 79, heartRateBpm: 100, respiratoryRateBpm: 20 }
          : this.delayed
            ? { systolicMmHg: 94, diastolicMmHg: 58, meanArterialMmHg: 70, heartRateBpm: 124, respiratoryRateBpm: 26 }
            : { systolicMmHg: 102, diastolicMmHg: 64, meanArterialMmHg: 77, heartRateBpm: 112, respiratoryRateBpm: 22 };
    return { ...circulation, spo2Percent: 97, coreTemperatureC: 36.7, alertness: 'awake with generalized weakness' };
  }

  snapshot(tick: number): RefeedingSnapshot {
    const electrolyteAt = this.completeAt ?? this.phosphateAt;
    const electrolyteResponded = this.completeAt !== null ? this.electrolytesResponded : this.phosphateResponded;
    const responseAt = this.responseAt();
    return { supportActive: this.supportAt !== null, contextReviewedAtTick: this.contextAt, monitoringAtTick: this.monitoringAt,
      thiamineAtTick: this.thiamineAt, phosphateAtTick: this.phosphateAt,
      completeElectrolytesAtTick: this.completeAt, nutritionPlanAtTick: this.nutritionAt,
      electrolyteDueInSeconds: !this.ended && electrolyteAt !== null && !electrolyteResponded
        ? Math.max(0, Math.ceil((electrolyteAt + REFEEDING_ELECTROLYTE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      responseDueInSeconds: !this.ended && responseAt !== null && !this.responded
        ? Math.max(0, Math.ceil((responseAt + REFEEDING_RESPONSE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      electrolyteResponseObserved: this.electrolytesObserved, responseObserved: this.responseObserved,
      recurrentDeclineObserved: this.recurrenceObserved, feedingAdvanceAttempted: this.feedingAdvanceAttempted,
      monitoringStopAttempted: this.monitoringStopAttempted, observation: this.observation ? { ...this.observation } : null,
      alertness: this.vitals().alertness, choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
