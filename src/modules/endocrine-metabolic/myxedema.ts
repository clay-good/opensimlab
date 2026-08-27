import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { MyxedemaSnapshot } from '@platform/kernel/protocol';
export type { MyxedemaSnapshot } from '@platform/kernel/protocol';

// All clocks are authored teaching checkpoints, not treatment deadlines or kinetics.
export const MYXEDEMA_VENTILATION_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const MYXEDEMA_RESPIRATORY_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const MYXEDEMA_ENDOCRINE_DELAY_TICKS = 15 * 60 * TICKS_PER_SECOND;
export const MYXEDEMA_RESPONSE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const MYXEDEMA_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const MYXEDEMA_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
export type MyxedemaAction = 'call-support' | 'ventilate' | 'oxygen-only' | 'hydrocortisone'
  | 'levothyroxine' | 'supportive-care' | 'reassess' | 'handoff' | 'wait-for-labs' | 'rapid-rewarming';
export interface MyxedemaEvent { readonly id: string; readonly message: string }
type MyxedemaVitals = Omit<NonNullable<MyxedemaSnapshot['observation']>, 'atTick'>;

export function supportsMyxedema(scenario: Scenario): boolean {
  return scenario.metadata.id === 'myxedema-coma-ventilation-and-steroid-sequence'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'myxedema').length === 1
    && scenario.timeline.filter((event) => event.target === 'myxedema-boundary').length === 1;
}

/** Dose-free qualified-team decisions; neither procedures nor hormone kinetics are simulated. */
export class Myxedema {
  private supportAt: number | null = null;
  private ventilationAt: number | null = null;
  private oxygenAt: number | null = null;
  private hydrocortisoneAt: number | null = null;
  private levothyroxineAt: number | null = null;
  private supportiveAt: number | null = null;
  private respiratoryDelayed = false;
  private endocrineDelayed = false;
  private waitedForLabs = false;
  private earlyThyroxine = false;
  private rapidRewarming = false;
  private ventilationResponded = false;
  private responded = false;
  private respiratoryReassessed = false;
  private reassessed = false;
  private observation: MyxedemaSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: MyxedemaSnapshot['ended'] = null;

  private packageAt(): number | null {
    const times = [this.supportAt, this.ventilationAt, this.hydrocortisoneAt, this.levothyroxineAt, this.supportiveAt];
    return times.every((tick) => tick !== null) ? Math.max(...times as number[]) : null;
  }

  advance(tick: number): MyxedemaEvent[] {
    if (this.ended) return [];
    const events: MyxedemaEvent[] = [];
    const endocrineCovered = this.hydrocortisoneAt !== null && this.levothyroxineAt !== null;
    if (this.ventilationAt === null && tick >= MYXEDEMA_RESPIRATORY_DELAY_TICKS && !this.respiratoryDelayed) {
      this.respiratoryDelayed = true;
      events.push({ id: 'respiratory-delay', message: 'At the authored 5-minute checkpoint without ventilatory support, ventilation and responsiveness worsen. Oxygen-only can improve saturation while carbon dioxide remains high. This is not a safe waiting interval or a predicted clinical timeline.' });
    }
    if (!endocrineCovered && tick >= MYXEDEMA_ENDOCRINE_DELAY_TICKS && !this.endocrineDelayed) {
      this.endocrineDelayed = true;
      events.push({ id: 'endocrine-delay', message: 'At the authored 15-minute checkpoint, circulation and responsiveness worsen while the steroid-first endocrine pathway remains incomplete, even if ventilation is supported. This contrast is not a clinical deterioration prediction or permission to wait.' });
    }
    if (!this.ventilationResponded && this.ventilationAt !== null && tick - this.ventilationAt >= MYXEDEMA_VENTILATION_TICKS) {
      this.ventilationResponded = true;
      events.push({ id: 'ventilation-response', message: 'The authored 5-minute ventilatory-support checkpoint improves the supplied respiratory rate, oxygen saturation, and carbon dioxide value. Obtain a fresh assessment. This support-dependent response does not demonstrate endocrine recovery or procedural competence.' });
    }
    const packageAt = this.packageAt();
    if (!this.responded && packageAt !== null && tick - packageAt >= MYXEDEMA_RESPONSE_TICKS) {
      this.responded = true;
      events.push({ id: 'response', message: 'The authored 1-hour complete-care checkpoint shows partial stabilization under continuing support. The patient remains drowsy, hypothermic, bradycardic, and hypercapnic. Reassess now; this is not a hormone-kinetics prediction or thyroid recovery.' });
    }
    if (((this.ventilationAt === null || !endocrineCovered) && tick >= MYXEDEMA_TAKEOVER_TICKS) || tick >= MYXEDEMA_SESSION_TICKS) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: this.ventilationAt === null || !endocrineCovered
        ? 'Instructor takeover ends the branch with urgent ventilatory or steroid-first endocrine treatment missing. This 30-minute teaching stop is not a clinical deadline or an injury or death prediction.'
        : 'Instructor takeover ends the unfinished 180-minute rehearsal. Review the missing support, supportive care, fresh assessment, or handoff. This teaching limit does not predict a clinical outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): MyxedemaEvent[] {
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
        return emit('support', 'Qualified emergency, endocrine, critical-care, nursing, and monitoring support is active. Escalation, assessment, and urgent treatment proceed together.');
      case 'ventilate':
        if (this.ventilationAt !== null) return events;
        this.ventilationAt = tick;
        return emit('ventilation', 'The qualified team starts airway and ventilatory support for the supplied hypoventilation and hypercapnia without waiting for hormone treatment, laboratory confirmation, or a support acknowledgment. No airway technique, device setting, or procedural competence is simulated.');
      case 'oxygen-only':
        if (this.ventilationAt !== null) return emit('action-refused', 'Ventilatory support has already begun. Substituting oxygen alone for ventilation is no longer the current decision.');
        if (this.oxygenAt !== null) return events;
        this.oxygenAt = tick;
        return emit('oxygen-only', 'Oxygen alone raises the fictional saturation to 94%, but does not correct hypoventilation or carbon dioxide retention. A reassuring saturation is not proof of adequate ventilation; the attempted substitution remains in the learning record.');
      case 'hydrocortisone':
        if (this.hydrocortisoneAt !== null) return events;
        this.hydrocortisoneAt = tick;
        return emit('hydrocortisone', 'Qualified empiric hydrocortisone coverage begins before thyroid hormone without waiting for laboratory confirmation or other scenario actions. No dose, route technique, or adrenal diagnosis is simulated.');
      case 'levothyroxine':
        if (this.levothyroxineAt !== null) return events;
        if (this.hydrocortisoneAt === null) {
          this.earlyThyroxine = true;
          return emit('early-thyroxine-refused', 'Levothyroxine was not given. Start qualified empiric hydrocortisone coverage first in this suspected myxedema-coma pathway. The sequence does not require an invented waiting interval; urgent ventilatory and supportive care continue in parallel.');
        }
        this.levothyroxineAt = tick;
        return emit('levothyroxine', 'The qualified team starts levothyroxine after accepted hydrocortisone coverage. No dose, kinetics, or durable response is inferred. Ventilatory support and diagnostic investigation continue.');
      case 'supportive-care':
        if (this.supportiveAt !== null) return events;
        this.supportiveAt = tick;
        return emit('supportive-care', 'Qualified supportive care includes cautious passive warming, individualized circulatory support, and assessment and treatment of precipitants and metabolic disturbances. No unmeasured laboratory result, automatic fluid load, or rapid active rewarming is assumed.');
      case 'reassess': {
        const current = this.vitals(); this.observation = { atTick: tick, ...current };
        if (this.ventilationResponded) this.respiratoryReassessed = true;
        if (this.responded) this.reassessed = true;
        return emit(this.responded ? 'post-treatment-reassessment' : this.ventilationResponded ? 'respiratory-reassessment' : 'early-reassessment',
          `New fictional bedside assessment: temperature ${current.coreTemperatureC}°C, HR ${current.heartRateBpm}/min, BP ${current.systolicMmHg}/${current.diastolicMmHg} mmHg, RR ${current.respiratoryRateBpm}/min, SpO₂ ${current.spo2Percent}%, supplied PaCO₂ ${current.paco2MmHg} mmHg; ${current.alertness}. ${this.responded ? 'Partial stabilization still requires ongoing ventilatory, endocrine, circulatory, and precipitant care; recovery is not established.' : 'Improved saturation alone does not establish ventilation or endocrine recovery. Continue the outstanding care and serial assessment.'}`);
      }
      case 'wait-for-labs':
        if (this.ventilationAt !== null && this.hydrocortisoneAt !== null && this.levothyroxineAt !== null) return emit('action-refused', 'All urgent ventilatory and steroid-first endocrine pathways have already started. Waiting before beginning them is no longer the current decision.');
        this.waitedForLabs = true;
        return emit('diagnostic-delay-choice', 'Do not defer remaining urgent ventilatory or steroid-first endocrine care for confirmatory laboratory results in this supplied suspected myxedema-coma presentation. Qualified treatment and diagnostic investigation proceed together.');
      case 'rapid-rewarming':
        this.rapidRewarming = true;
        return emit('rapid-rewarming-refused', 'Rapid active rewarming was not applied. This pathway uses cautious passive warming with qualified circulatory monitoring and supportive care. The attempted shortcut remains in the learning record.');
      case 'handoff':
        if (!this.respiratoryReassessed || !this.reassessed || this.packageAt() === null) return emit('handoff-refused', 'Keep the episode open until the qualified care package and fresh respiratory-support and complete-care reassessments are recorded.');
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns ongoing ventilatory support, steroid-first endocrine treatment, circulatory and temperature monitoring, serial assessment, and precipitant care. The patient remains drowsy and support-dependent. The rehearsal ends without declaring thyroid recovery, discharge readiness, or procedural competence.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional myxedema lesson. Nothing changed.');
    }
  }

  vitals(): MyxedemaVitals {
    if (this.responded) return { systolicMmHg: 96, diastolicMmHg: 58, meanArterialMmHg: 71, heartRateBpm: 46,
      respiratoryRateBpm: 12, spo2Percent: 94, coreTemperatureC: 34.2, paco2MmHg: 54, alertness: 'still drowsy and support-dependent' };
    const delayed = this.respiratoryDelayed || this.endocrineDelayed;
    const systemic = delayed
      ? { systolicMmHg: 80, diastolicMmHg: 46, meanArterialMmHg: 57, heartRateBpm: 38, coreTemperatureC: 33.8, alertness: 'harder to rouse; circulatory compromise persists' }
      : { systolicMmHg: 88, diastolicMmHg: 54, meanArterialMmHg: 65, heartRateBpm: 42, coreTemperatureC: 34, alertness: 'drowsy' };
    // Authored respiratory support is independent of the endocrine care package.
    return { ...systemic, respiratoryRateBpm: this.ventilationResponded ? 12 : this.respiratoryDelayed ? 6 : 8,
      spo2Percent: this.ventilationResponded || this.oxygenAt !== null ? 94 : this.respiratoryDelayed ? 86 : 90,
      paco2MmHg: this.ventilationResponded ? 54 : this.respiratoryDelayed ? 78 : 68 };
  }

  snapshot(tick: number): MyxedemaSnapshot {
    const packageAt = this.packageAt();
    return { supportActive: this.supportAt !== null, ventilationAtTick: this.ventilationAt, oxygenOnlyAtTick: this.oxygenAt,
      hydrocortisoneAtTick: this.hydrocortisoneAt, levothyroxineAtTick: this.levothyroxineAt, supportiveCareAtTick: this.supportiveAt,
      ventilationDueInSeconds: !this.ended && this.ventilationAt !== null && !this.ventilationResponded
        ? Math.max(0, Math.ceil((this.ventilationAt + MYXEDEMA_VENTILATION_TICKS - tick) / TICKS_PER_SECOND)) : null,
      responseDueInSeconds: !this.ended && packageAt !== null && !this.responded
        ? Math.max(0, Math.ceil((packageAt + MYXEDEMA_RESPONSE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      respiratorySupportObserved: this.respiratoryReassessed, responseObserved: this.reassessed,
      ventilationDelayed: this.respiratoryDelayed, endocrineTreatmentDelayed: this.endocrineDelayed,
      waitForLabsChosen: this.waitedForLabs, earlyThyroxineAttempted: this.earlyThyroxine, rapidRewarmingAttempted: this.rapidRewarming,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended, authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
