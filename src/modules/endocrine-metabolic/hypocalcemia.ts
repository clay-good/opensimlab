import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { HypocalcemiaSnapshot } from '@platform/kernel/protocol';
export type { HypocalcemiaSnapshot } from '@platform/kernel/protocol';

// All clocks are authored teaching contrasts, not treatment deadlines or kinetics.
export const HYPOCALCEMIA_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS = 15 * 60 * TICKS_PER_SECOND;
export const HYPOCALCEMIA_RECURRENCE_TICKS = 45 * 60 * TICKS_PER_SECOND;
export const HYPOCALCEMIA_RESPONSE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const HYPOCALCEMIA_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const HYPOCALCEMIA_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const HYPOCALCEMIA_ACTIONS = ['call-support', 'assess-risk', 'calcium-rescue', 'review-cause',
  'magnesium', 'continuing-care', 'reassess', 'handoff', 'oral-only',
  'wait-for-labs', 'wait-for-magnesium', 'stop-after-relief'] as const;
export type HypocalcemiaAction = typeof HYPOCALCEMIA_ACTIONS[number];
export interface HypocalcemiaEvent { readonly id: string; readonly message: string }
type HypocalcemiaVitals = Omit<NonNullable<HypocalcemiaSnapshot['observation']>, 'atTick'>;

export function supportsHypocalcemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypocalcemic-tetany-rescue-and-recurrence'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'hypocalcemia').length === 1
    && scenario.timeline.filter((event) => event.target === 'hypocalcemia-boundary').length === 1;
}

/** Qualified-team rehearsal; no calcium prescription, magnesium kinetics, or QT waveform model. */
export class Hypocalcemia {
  private supportAt: number | null = null;
  private riskAt: number | null = null;
  private causeAt: number | null = null;
  private calciumAt: number | null = null;
  private magnesiumAt: number | null = null;
  private continuingAt: number | null = null;
  private delayed = false;
  private recurred = false;
  private oralOnly = false;
  private waitedForLabs = false;
  private waitedForMagnesium = false;
  private stoppedAfterRelief = false;
  private calciumResponded = false;
  private responded = false;
  private calciumObserved = false;
  private responseObserved = false;
  private observation: HypocalcemiaSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: HypocalcemiaSnapshot['ended'] = null;

  private packageAt(): number | null {
    const times = [this.supportAt, this.riskAt, this.causeAt, this.calciumAt, this.magnesiumAt, this.continuingAt];
    return times.every((tick) => tick !== null) ? Math.max(...times as number[]) : null;
  }

  advance(tick: number): HypocalcemiaEvent[] {
    if (this.ended) return [];
    const events: HypocalcemiaEvent[] = [];
    if (this.calciumAt === null && tick >= HYPOCALCEMIA_DELAY_TICKS && !this.delayed) {
      this.delayed = true;
      events.push({ id: 'urgent-treatment-delay', message: 'At the authored 5-minute checkpoint without monitored calcium rescue, painful spasm and distress increase. This contrast is not a safe waiting period or a prediction of seizure or airway obstruction.' });
    }
    if (!this.calciumResponded && this.calciumAt !== null && tick - this.calciumAt >= HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS) {
      this.calciumResponded = true;
      events.push({ id: 'calcium-response', message: 'The authored 15-minute calcium-rescue checkpoint is ready for reassessment. Initial spasm relief does not establish corrected calcium, magnesium, parathyroid recovery, or freedom from recurrence.' });
    }
    if (!this.recurred && this.calciumAt !== null && tick - this.calciumAt >= HYPOCALCEMIA_RECURRENCE_TICKS
      && (this.magnesiumAt === null || this.continuingAt === null)) {
      this.recurred = true;
      events.push({ id: 'recurrence', message: 'Spasm recurs in the authored 45-minute contrast while magnesium treatment or continuing calcium and cause care remains missing. Escalate and reassess qualified treatment now. This is not a prediction of drug duration or proof that a particular omission alone caused a real recurrence.' });
    }
    const packageAt = this.packageAt();
    if (!this.responded && packageAt !== null && tick - packageAt >= HYPOCALCEMIA_RESPONSE_TICKS) {
      this.responded = true;
      events.push({ id: 'response', message: 'The authored 60-minute complete-care checkpoint shows partial symptom support with low calcium still present. Obtain a fresh assessment. Neither magnesium normalization nor activated-vitamin-D efficacy is modeled.' });
    }
    if ((this.calciumAt === null && tick >= HYPOCALCEMIA_TAKEOVER_TICKS) || tick >= HYPOCALCEMIA_SESSION_TICKS) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: this.calciumAt === null
        ? 'Instructor takeover ends this branch with monitored calcium rescue missing. The 30-minute teaching stop is not a treatment deadline or a clinical outcome prediction.'
        : 'Instructor takeover ends the unfinished 180-minute rehearsal. Review missing cause care, monitoring, reassessment, and handoff; this teaching limit predicts no clinical outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): HypocalcemiaEvent[] {
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
        return emit('support', 'Qualified endocrine, surgical, emergency, nursing, and monitoring support is active. Coordinate rescue and continuing care without waiting for an acknowledgment before urgent treatment.');
      case 'assess-risk':
        if (this.riskAt !== null) return events;
        this.riskAt = tick;
        return emit('risk-assessment', 'The supplied initial assessment shows a patent airway, no neck swelling, and no seizure. Continue airway, wound, neurologic, and rhythm surveillance. New stridor or swelling after thyroid surgery needs immediate qualified airway and surgical assessment, not an assumption of calcium-related laryngospasm. The supplied QTc is an ECG report, not computed from the illustrative waveform.');
      case 'calcium-rescue':
        if (this.calciumAt !== null) return events;
        this.calciumAt = tick;
        return emit('calcium-rescue', 'Qualified monitored intravenous calcium rescue begins, including ECG monitoring and urgent bedside safety assessment. No dose, concentration, rate, access, or calcium preparation is selected here. Do not await magnesium correction or the full cause panel before treating severe symptomatic hypocalcemia.');
      case 'review-cause':
        if (this.causeAt !== null) return events;
        this.causeAt = tick;
        return emit('cause-review', 'Review the supplied postoperative parathyroid and low-magnesium findings with renal, phosphate, and vitamin D context. They inform continuing calcium, magnesium, and qualified activated-vitamin-D care. Early postoperative dysfunction is not proof of permanent hypoparathyroidism. No new laboratory acquisition is simulated.');
      case 'magnesium':
        if (this.magnesiumAt !== null) return events;
        if (this.causeAt === null) return emit('magnesium-review-refused', 'Open the supplied cause findings before selecting this qualified magnesium pathway. This information step does not delay calcium rescue or require a new sample.');
        this.magnesiumAt = tick;
        return emit('magnesium', 'Qualified treatment and monitoring of documented low magnesium begins alongside calcium care. Magnesium depletion can impair parathyroid secretion and action; this request does not normalize magnesium instantly.');
      case 'continuing-care':
        if (this.continuingAt !== null) return events;
        if (this.causeAt === null) return emit('continuing-care-review-refused', 'Open the supplied cause findings so the qualified team can individualize continuing calcium and activated-vitamin-D care. Rescue remains available immediately.');
        this.continuingAt = tick;
        return emit('continuing-care', 'Qualified continuing calcium, postoperative cause-directed activated-vitamin-D care, and serial calcium, magnesium, phosphate, renal, and clinical monitoring are established. No replacement prescription, immediate vitamin D effect, or discharge clearance is implied.');
      case 'oral-only':
      case 'wait-for-labs':
      case 'wait-for-magnesium':
        if (this.calciumAt !== null) return emit('action-refused', 'Monitored calcium rescue has already started. Choosing to defer its start is no longer the current decision.');
        if (action === 'oral-only') this.oralOnly = true;
        if (action === 'wait-for-labs') this.waitedForLabs = true;
        if (action === 'wait-for-magnesium') this.waitedForMagnesium = true;
        return emit(`${action}-choice`, 'Severe symptomatic hypocalcemia needs urgent qualified monitored calcium treatment. Oral-only care, awaiting every result, or waiting for magnesium normalization does not provide that rescue. The choice is retained; treatment and investigation can proceed together.');
      case 'stop-after-relief':
        if (!this.calciumResponded) return emit('action-refused', 'No calcium-rescue response has occurred yet. Reassess and continue urgent care.');
        this.stoppedAfterRelief = true;
        return emit('stop-after-relief-refused', 'Ongoing treatment was not stopped. Early spasm relief is not durable correction. Continue cause care and surveillance for recurrent symptoms, low calcium, rhythm risk, and treatment complications.');
      case 'reassess': {
        const current = this.vitals(); this.observation = { atTick: tick, ...current };
        if (this.calciumResponded && !this.responded) this.calciumObserved = true;
        if (this.responded) this.responseObserved = true;
        return emit(this.responded ? 'response-reassessment' : this.recurred ? 'recurrence-reassessment'
          : this.calciumResponded ? 'calcium-reassessment' : 'early-reassessment',
        `Fresh fictional assessment: BP ${current.systolicMmHg}/${current.diastolicMmHg} mmHg, HR ${current.heartRateBpm}/min, RR ${current.respiratoryRateBpm}/min, SpO₂ ${current.spo2Percent}%, supplied adjusted calcium ${current.adjustedCalciumMgDl} mg/dL; ${current.symptoms}. Airway remains patent in this authored observation. Repeat ECG and magnesium assessment remain necessary; neither QT nor magnesium recovery is supplied.`);
      }
      case 'handoff':
        if (this.packageAt() === null || !this.responseObserved) {
          return emit('handoff-refused', 'Keep the episode open until qualified support, risk and cause review, rescue, magnesium and continuing care, and a fresh later support assessment are recorded. A missed earlier assessment remains learning evidence, not a reason to withhold an otherwise appropriate handoff.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns ongoing calcium and magnesium management, cause-directed therapy, airway and rhythm vigilance, repeat laboratory and ECG assessment, and monitoring for recurrence or overtreatment. This ends the rehearsal, not hypocalcemia; permanent hypoparathyroidism, treatment cessation, and discharge readiness are not established.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional hypocalcemia lesson. Nothing changed.');
    }
  }

  vitals(): HypocalcemiaVitals {
    const state = this.responded
      ? { heartRateBpm: 86, respiratoryRateBpm: 18, adjustedCalciumMgDl: 7.2, symptoms: 'spasm eased under continuing support; tingling and low calcium persist' }
      : this.recurred
        ? { heartRateBpm: 106, respiratoryRateBpm: 22, adjustedCalciumMgDl: 6.7, symptoms: 'painful carpopedal spasm has recurred; urgent reassessment is required' }
        : this.calciumResponded
          ? { heartRateBpm: 90, respiratoryRateBpm: 18, adjustedCalciumMgDl: 7, symptoms: 'spasm is less painful; tingling and recurrence risk remain' }
          : this.delayed
            ? { heartRateBpm: 110, respiratoryRateBpm: 24, adjustedCalciumMgDl: 6.6, symptoms: 'painful spasm and distress have increased; the airway remains patent' }
            : { heartRateBpm: 98, respiratoryRateBpm: 20, adjustedCalciumMgDl: 6.6, symptoms: 'painful carpopedal spasm and perioral tingling; airway patent' };
    return { systolicMmHg: 112, diastolicMmHg: 68, meanArterialMmHg: 83, spo2Percent: 98, coreTemperatureC: 36.8, ...state };
  }

  snapshot(tick: number): HypocalcemiaSnapshot {
    const packageAt = this.packageAt();
    return { supportActive: this.supportAt !== null, riskAssessedAtTick: this.riskAt, causeReviewedAtTick: this.causeAt,
      calciumAtTick: this.calciumAt, magnesiumAtTick: this.magnesiumAt, continuingCareAtTick: this.continuingAt,
      calciumDueInSeconds: !this.ended && this.calciumAt !== null && !this.calciumResponded
        ? Math.max(0, Math.ceil((this.calciumAt + HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      responseDueInSeconds: !this.ended && packageAt !== null && !this.responded
        ? Math.max(0, Math.ceil((packageAt + HYPOCALCEMIA_RESPONSE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      calciumResponseObserved: this.calciumObserved, responseObserved: this.responseObserved,
      urgentTreatmentDelayed: this.delayed, recurrenceOccurred: this.recurred, oralOnlyChosen: this.oralOnly,
      waitForLabsChosen: this.waitedForLabs, waitForMagnesiumChosen: this.waitedForMagnesium,
      stopAfterReliefAttempted: this.stoppedAfterRelief, observation: this.observation ? { ...this.observation } : null,
      symptoms: this.vitals().symptoms, choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
