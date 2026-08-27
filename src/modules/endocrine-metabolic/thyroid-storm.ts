import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { ThyroidStormSnapshot } from '@platform/kernel/protocol';
export type { ThyroidStormSnapshot } from '@platform/kernel/protocol';

// US ATA sequencing constraint; all other checkpoints are authored teaching clocks.
export const THYROID_IODINE_WAIT_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const THYROID_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const THYROID_RESPONSE_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const THYROID_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const THYROID_SESSION_TICKS = 240 * 60 * TICKS_PER_SECOND;
export type ThyroidStormAction = 'call-support' | 'synthesis-blockade' | 'supportive-care'
  | 'assess-circulation' | 'rate-control-review' | 'iodine' | 'reassess' | 'handoff'
  | 'wait-for-labs' | 'blanket-beta-blockade';
export interface ThyroidStormEvent { readonly id: string; readonly message: string }
type ThyroidStormVitals = Omit<NonNullable<ThyroidStormSnapshot['observation']>, 'atTick'>;

export function supportsThyroidStorm(scenario: Scenario): boolean {
  return scenario.metadata.id === 'thyroid-storm-hemodynamic-risk'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'thyroid-storm').length === 1
    && scenario.timeline.filter((event) => event.target === 'thyroid-storm-boundary').length === 1;
}

/** Dose-free US-pathway rehearsal; no drug kinetics or patient outcomes are predicted. */
export class ThyroidStorm {
  private supportAt: number | null = null;
  private synthesisAt: number | null = null;
  private supportiveAt: number | null = null;
  private circulationAt: number | null = null;
  private rateReviewAt: number | null = null;
  private iodineAt: number | null = null;
  private delayed = false;
  private waitedForLabs = false;
  private blanketBeta = false;
  private earlyIodine = false;
  private responded = false;
  private reassessed = false;
  private observation: ThyroidStormSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: ThyroidStormSnapshot['ended'] = null;

  private packageAt(): number | null {
    const times = [this.supportAt, this.synthesisAt, this.supportiveAt, this.circulationAt, this.rateReviewAt, this.iodineAt];
    return times.every((tick) => tick !== null) ? Math.max(...times as number[]) : null;
  }

  advance(tick: number): ThyroidStormEvent[] {
    if (this.ended) return [];
    const events: ThyroidStormEvent[] = [];
    const urgentCovered = this.synthesisAt !== null && this.supportiveAt !== null;
    if (!urgentCovered && tick >= THYROID_DELAY_TICKS && !this.delayed) {
      this.delayed = true;
      events.push({ id: 'incomplete-urgent-coverage', message: 'The authored patient becomes more confused and poorly perfused while urgent synthesis blockade or supportive care remains missing. This 5-minute checkpoint is not a safe waiting period.' });
    }
    const packageAt = this.packageAt();
    if (!this.responded && packageAt !== null && tick - packageAt >= THYROID_RESPONSE_TICKS) {
      this.responded = true;
      events.push({ id: 'response', message: 'The authored 2-hour complete-care checkpoint shows early partial stabilization under supportive care. Obtain a fresh bedside reassessment. This is not a hormone-kinetics prediction, expected clinical response, or proof that heart failure, the precipitant, or thyroid storm has resolved.' });
    }
    if ((!urgentCovered && tick >= THYROID_TAKEOVER_TICKS) || tick >= THYROID_SESSION_TICKS) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: !urgentCovered
        ? 'Instructor takeover ends the branch with urgent synthesis blockade or supportive care still missing. The 30-minute teaching stop predicts no injury or death and is not a treatment deadline.'
        : 'Instructor takeover closes the unfinished 240-minute rehearsal. Review the missing monitoring, sequence-safe treatment, assessment, or handoff decision. This teaching limit is not a clinical deadline or an outcome prediction.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): ThyroidStormEvent[] {
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
        return emit('support', 'Qualified emergency, endocrine, critical-care, nursing, and monitoring support is active. Treatment and escalation proceed together.');
      case 'synthesis-blockade':
        if (this.synthesisAt !== null) return events;
        this.synthesisAt = tick;
        return emit('synthesis-blockade', 'The qualified team starts a thionamide synthesis-blockade pathway without waiting for confirmatory laboratory results, support acknowledgment, or a completed circulation assessment. No drug selection, dose, or delivery technique is simulated.');
      case 'supportive-care':
        if (this.supportiveAt !== null) return events;
        this.supportiveAt = tick;
        return emit('supportive-care', 'Qualified glucocorticoid, cooling, oxygenation, individualized circulatory support, and precipitant-care pathways begin without waiting for diagnostic results. Congestion and perfusion require repeated review; no automatic fluid load or dose is selected.');
      case 'assess-circulation':
        if (this.circulationAt !== null) return events;
        this.circulationAt = tick;
        return emit('circulation-assessment', 'The supplied circulation assessment shows cool extremities, poor peripheral perfusion, and pulmonary congestion: possible heart failure or low-output risk. Tachycardia alone cannot establish tolerance of beta blockade. Qualified bedside and cardiac assessment remain necessary.');
      case 'rate-control-review':
        if (this.circulationAt === null) return emit('rate-control-review-refused', 'Assess perfusion and congestion before a qualified individualized rate-control decision. Neither this assessment nor rate control delays synthesis blockade or supportive care.');
        if (this.rateReviewAt !== null) return events;
        this.rateReviewAt = tick;
        return emit('rate-control-review', 'The qualified team reviews rate-control options against poor perfusion and congestion, with close hemodynamic monitoring and specialist ownership. This records an individualized review, not automatic beta-blocker administration or proof that any agent is safe.');
      case 'iodine':
        if (this.iodineAt !== null) return events;
        if (this.synthesisAt === null || tick - this.synthesisAt < THYROID_IODINE_WAIT_TICKS) {
          this.earlyIodine = true;
          return emit('early-iodine-refused', 'Iodine was not given. This explicitly US ATA-based pathway requires at least 1 hour after thionamide synthesis blockade. Continue urgent care and monitoring while preserving that sequence; other specialist pathways may differ.');
        }
        this.iodineAt = tick;
        return emit('iodine', 'Qualified iodine treatment is started after at least 1 hour of synthesis blockade in the selected US ATA pathway. This is a sequence decision, not a dose or route simulation.');
      case 'reassess': {
        const current = this.vitals(); this.observation = { atTick: tick, ...current };
        if (this.responded) this.reassessed = true;
        return emit(this.responded ? 'post-treatment-reassessment' : 'early-reassessment', `New fictional bedside assessment: temperature ${current.coreTemperatureC}°C, HR ${current.heartRateBpm}/min, BP ${current.systolicMmHg}/${current.diastolicMmHg} mmHg, RR ${current.respiratoryRateBpm}/min, SpO₂ ${current.spo2Percent}%; ${current.alertness}. ${this.responded ? 'Improvement is incomplete. Serial perfusion, cardiac, laboratory, and precipitant review remain open.' : 'A current observation does not replace the outstanding treatment and monitoring decisions.'}`);
      }
      case 'wait-for-labs':
        if (this.synthesisAt !== null && this.supportiveAt !== null) return emit('action-refused', 'Both urgent treatment pathways have already started. Waiting before beginning them is no longer the current decision.');
        this.waitedForLabs = true;
        return emit('diagnostic-delay-choice', 'Do not defer the remaining urgent care for thyroid laboratory confirmation in this supplied suspected-storm presentation. Qualified synthesis blockade, supportive care, and diagnostic investigation proceed together.');
      case 'blanket-beta-blockade':
        this.blanketBeta = true;
        return emit('blanket-beta-blockade-refused', 'Blanket beta blockade was not given. Poor perfusion and possible cardiac failure require qualified individualized assessment; a high heart rate alone is not a safety check. The attempted shortcut remains in the learning record.');
      case 'handoff':
        if (!this.reassessed || this.packageAt() === null) return emit('handoff-refused', 'Keep the episode open until the qualified care package and a fresh post-treatment reassessment are recorded.');
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns ongoing thyroid-directed treatment, individualized hemodynamic and cardiac review, serial monitoring, and precipitant care. The rehearsal ends without declaring recovery, discharge readiness, or beta-blocker safety.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional thyroid-storm lesson. Nothing changed.');
    }
  }

  vitals(): ThyroidStormVitals {
    if (this.responded) return { systolicMmHg: 104, diastolicMmHg: 62, meanArterialMmHg: 76, heartRateBpm: 132, respiratoryRateBpm: 24, spo2Percent: 96, coreTemperatureC: 39.3, alertness: 'more attentive, still febrile and unwell' };
    if (this.delayed) return { systolicMmHg: 82, diastolicMmHg: 46, meanArterialMmHg: 58, heartRateBpm: 164, respiratoryRateBpm: 32, spo2Percent: 92, coreTemperatureC: 40.2, alertness: 'more confused; poor perfusion persists' };
    return { systolicMmHg: 96, diastolicMmHg: 58, meanArterialMmHg: 71, heartRateBpm: 148, respiratoryRateBpm: 28, spo2Percent: 94, coreTemperatureC: 39.8, alertness: 'agitated and confused' };
  }

  snapshot(tick: number): ThyroidStormSnapshot {
    const packageAt = this.packageAt();
    return { supportActive: this.supportAt !== null, synthesisAtTick: this.synthesisAt, supportiveCareAtTick: this.supportiveAt,
      circulationAssessedAtTick: this.circulationAt, rateControlReviewedAtTick: this.rateReviewAt, iodineAtTick: this.iodineAt,
      iodineDueInSeconds: !this.ended && this.synthesisAt !== null && this.iodineAt === null
        ? Math.max(0, Math.ceil((this.synthesisAt + THYROID_IODINE_WAIT_TICKS - tick) / TICKS_PER_SECOND)) : null,
      responseDueInSeconds: !this.ended && packageAt !== null && !this.responded
        ? Math.max(0, Math.ceil((packageAt + THYROID_RESPONSE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      circulationRisk: this.circulationAt === null ? 'unassessed' : 'congested-poor-perfusion',
      urgentCoverageDelayed: this.delayed, waitForLabsChosen: this.waitedForLabs,
      blanketBetaBlockadeChosen: this.blanketBeta, earlyIodineAttempted: this.earlyIodine,
      responseObserved: this.reassessed, observation: this.observation ? { ...this.observation } : null,
      alertness: this.vitals().alertness, choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
