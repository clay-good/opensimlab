import type { AdrenalCrisisSnapshot } from '@platform/kernel/protocol';
import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';

// Authored rehearsal checkpoints, not safe delays or predicted treatment kinetics.
export const ADRENAL_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const ADRENAL_RESPONSE_TICKS = 10 * 60 * TICKS_PER_SECOND;
export const ADRENAL_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export type AdrenalCrisisAction = 'call-support' | 'hydrocortisone' | 'saline'
  | 'review-record' | 'reassess' | 'wait-for-cortisol' | 'oral-only' | 'prevention' | 'handoff';
export interface AdrenalCrisisEvent { readonly id: string; readonly message: string }

export function supportsAdrenalCrisis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'adrenal-crisis-treatment-before-tests'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'adrenal-crisis').length === 1
    && scenario.timeline.filter((event) => event.target === 'adrenal-crisis-boundary').length === 1;
}

/** Dose-free decisions change authored patient states independently of observation. */
export class AdrenalCrisis {
  private support = false;
  private steroidAt: number | null = null;
  private salineAt: number | null = null;
  private record = false;
  private prevention = false;
  private delayed = false;
  private responded = false;
  private reassessed = false;
  private observation: AdrenalCrisisSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: AdrenalCrisisSnapshot['ended'] = null;

  advance(tick: number): AdrenalCrisisEvent[] {
    if (this.ended) return [];
    const events: AdrenalCrisisEvent[] = [];
    const both = this.steroidAt !== null && this.salineAt !== null;
    if (!both && tick >= ADRENAL_DELAY_TICKS && !this.delayed) {
      this.delayed = true;
      events.push({ id: 'incomplete-rescue', message: 'Shock persists while the emergency pathway is incomplete. The authored patient is more drowsy. Start the missing qualified treatment now; this checkpoint is not a safe period to wait.' });
    }
    if (both && !this.responded && tick - Math.max(this.steroidAt!, this.salineAt!) >= ADRENAL_RESPONSE_TICKS) {
      this.responded = true;
      events.push({ id: 'response', message: 'The authored circulation and alertness improve after combined qualified rescue. Obtain a new bedside reassessment. Steroid continuation, fluid balance, electrolytes, glucose, and the precipitating illness still need active care.' });
    }
    if (!both && tick >= ADRENAL_TAKEOVER_TICKS) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends this branch because emergency rescue remains incomplete. No death, organ injury, or real treatment deadline is predicted. Review the missed decision and try again.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): AdrenalCrisisEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => { if (!this.ended || id === 'handoff') this.feedback = message; return [...events, { id, message }]; };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'call-support':
        if (this.support) return events;
        this.support = true;
        return emit('support', 'Qualified emergency, endocrine, nursing, monitoring, and precipitant-care support is active. Help and treatment proceed together.');
      case 'hydrocortisone':
        if (this.steroidAt !== null) return events;
        this.steroidAt = tick;
        return emit('hydrocortisone', 'The qualified team starts immediate parenteral hydrocortisone and ongoing replacement. No cortisol result, full history, or support acknowledgment was required first. This action selects no dose, preparation, route technique, or infusion rate.');
      case 'saline':
        if (this.salineAt !== null) return events;
        this.salineAt = tick;
        return emit('saline', 'The qualified team starts isotonic saline resuscitation with repeated blood pressure, perfusion, respiratory, and fluid-balance assessment. Fluid alone does not replace the missing glucocorticoid. No volume or rate is selected here.');
      case 'review-record':
        if (this.record) return events;
        this.record = true;
        return emit('record', 'The supplied record confirms primary adrenal insufficiency, hydrocortisone and fludrocortisone replacement, and 2 days of vomiting with tablets not retained. Initial sodium is 126 mmol/L, potassium 5.7 mmol/L, and glucose 96 mg/dL. These are initial results, not a live correction model. Investigate infection and other precipitants alongside rescue.');
      case 'reassess': {
        const current = this.vitals();
        this.observation = { atTick: tick, ...current };
        if (this.responded) this.reassessed = true;
        return emit(this.responded ? 'post-rescue-reassessment' : 'early-reassessment', `New fictional bedside assessment: BP ${current.systolicMmHg}/${current.diastolicMmHg} mmHg, HR ${current.heartRateBpm}/min; ${current.alertness}. ${this.responded ? 'Improvement is not resolution or permission to stop steroids. Serial laboratory and fluid-balance work remain.' : 'The emergency pathway and ongoing reassessment remain open.'}`);
      }
      case 'wait-for-cortisol':
        if (this.steroidAt !== null) return emit('action-refused', 'The parenteral steroid pathway has already started. This earlier decision is no longer available.');
        return emit('diagnostic-delay-choice', 'Waiting for cortisol is not the rescue plan. If feasible without delay, qualified staff may obtain diagnostic samples, but suspected crisis needs immediate parenteral hydrocortisone. The patient clock continues and treatment is still available.');
      case 'oral-only':
        if (this.steroidAt !== null) return emit('action-refused', 'The parenteral steroid pathway has already started. This earlier decision is no longer available.');
        return emit('oral-only-refused', 'Oral-only treatment was not given. Shock and persistent vomiting require the qualified parenteral pathway; tablets cannot be relied on in this scene.');
      case 'prevention':
        if (!this.record || !this.reassessed) return emit('prevention-refused', 'First complete rescue, reassess the response, and review the interrupted-replacement record. Prevention planning does not replace emergency care.');
        if (this.prevention) return events;
        this.prevention = true;
        return emit('prevention', 'The receiving team owns steroid continuity, sick-day education with teach-back, an emergency steroid card or medical alert, an injection kit with training, medication access, and endocrine follow-up. Recording this plan does not establish competence or safe discharge.');
      case 'handoff':
        if (!this.support || !this.reassessed || !this.prevention) return emit('handoff-refused', 'Keep the episode open until qualified support, a post-rescue reassessment, and the medication and prevention plan are in place.');
        this.ended = 'handoff';
        return emit('handoff', 'Ongoing parenteral steroid, individualized fluid and electrolyte monitoring, precipitant treatment, and prevention work are handed off. The rehearsal ends without declaring clinical recovery or discharge readiness.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional adrenal-crisis lesson. Nothing changed.');
    }
  }

  vitals() {
    if (this.responded) return { systolicMmHg: 102, diastolicMmHg: 60, meanArterialMmHg: 74, heartRateBpm: 100, respiratoryRateBpm: 20, alertness: 'more alert, still unwell' };
    if (this.delayed) return this.salineAt !== null
      ? { systolicMmHg: 82, diastolicMmHg: 48, meanArterialMmHg: 59, heartRateBpm: 120, respiratoryRateBpm: 24, alertness: 'drowsy; incomplete rescue' }
      : { systolicMmHg: 68, diastolicMmHg: 38, meanArterialMmHg: 48, heartRateBpm: 132, respiratoryRateBpm: 26, alertness: 'more drowsy; shock persists' };
    return { systolicMmHg: 78, diastolicMmHg: 44, meanArterialMmHg: 55, heartRateBpm: 124, respiratoryRateBpm: 24, alertness: 'weak and drowsy' };
  }

  snapshot(tick: number): AdrenalCrisisSnapshot {
    const both = this.steroidAt !== null && this.salineAt !== null;
    return { supportActive: this.support, hydrocortisoneAtTick: this.steroidAt, salineAtTick: this.salineAt,
      recordReviewed: this.record, preventionPlanned: this.prevention, responseObserved: this.reassessed,
      observation: this.observation, alertness: this.vitals().alertness,
      responseDueInSeconds: both && !this.responded ? Math.max(0, Math.ceil((Math.max(this.steroidAt!, this.salineAt!) + ADRENAL_RESPONSE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
