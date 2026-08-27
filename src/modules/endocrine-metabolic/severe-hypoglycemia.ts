import type { SevereHypoglycemiaSnapshot } from '@platform/kernel/protocol';
import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';

export const HYPOGLYCEMIA_RECHECK_TICKS = 10 * 60 * TICKS_PER_SECOND;
export const HYPOGLYCEMIA_RECURRENCE_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const HYPOGLYCEMIA_TAKEOVER_TICKS = 45 * 60 * TICKS_PER_SECOND;
export type HypoglycemiaAction = 'check-glucose' | 'call-support' | 'iv-rescue'
  | 'oral-glucose' | 'review-medications' | 'continue-monitoring' | 'close-case' | 'handoff';
export interface HypoglycemiaEvent { readonly id: string; readonly message: string }

export function supportsSevereHypoglycemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'severe-hypoglycemia-recurrence'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'severe-hypoglycemia-recurrence').length === 1
    && scenario.timeline.filter((event) => event.target === 'severe-hypoglycemia-recurrence-boundary').length === 1;
}

/** Authored, dose-free state transitions. Not a glucose or insulin kinetics model. */
export class SevereHypoglycemia {
  private support = false;
  private medicationReviewed = false;
  private monitoring = false;
  private initialCheck = false;
  private rescueAt: number | null = null;
  private secondRescueAt: number | null = null;
  private firstResponse = false;
  private secondResponse = false;
  private recurrence = false;
  private deteriorated = false;
  private glucose = 36;
  private measuredGlucose: number | null = null;
  private measuredAt: number | null = null;
  private firstRecheck = false;
  private secondRecheck = false;
  private ended: 'handoff' | 'instructor-takeover' | null = null;
  private choiceFeedback: string | null = null;

  advance(tick: number): HypoglycemiaEvent[] {
    if (this.ended) return [];
    const events: HypoglycemiaEvent[] = [];
    if (this.rescueAt === null && tick >= HYPOGLYCEMIA_RECHECK_TICKS && !this.deteriorated) {
      this.deteriorated = true; this.glucose = 28;
      events.push({ id: 'untreated-deterioration', message: 'Without rescue, the authored patient becomes harder to rouse. The low-glucose state remains active; obtain qualified rescue now. This is a teaching trajectory, not a predicted time to injury.' });
    }
    if (this.rescueAt !== null && !this.firstResponse && tick - this.rescueAt >= HYPOGLYCEMIA_RECHECK_TICKS) {
      this.firstResponse = true; this.glucose = 112;
      events.push({ id: 'first-response', message: 'Ten simulated minutes after the qualified IV rescue pathway, the patient is more alert. This authored response still requires a fresh glucose check; appearance alone does not close the episode.' });
    }
    if (this.rescueAt !== null && !this.recurrence && tick - this.rescueAt >= HYPOGLYCEMIA_RECURRENCE_TICKS) {
      this.recurrence = true; this.glucose = 42;
      events.push({ id: 'recurrence', message: 'The authored patient becomes sweaty and drowsy again 30 simulated minutes after first rescue. The earlier result is now stale. Reassess and re-activate qualified rescue; the ongoing medication and intake risks were not removed by the first response.' });
    }
    if (this.secondRescueAt !== null && !this.secondResponse && tick - this.secondRescueAt >= HYPOGLYCEMIA_RECHECK_TICKS) {
      this.secondResponse = true; this.glucose = 108;
      events.push({ id: 'second-response', message: 'Ten simulated minutes after repeat qualified rescue, alertness improves again. Repeat the glucose check and hand off the continuing recurrence risk; this is not discharge clearance.' });
    }
    if ((this.rescueAt === null && tick >= HYPOGLYCEMIA_TAKEOVER_TICKS)
      || (this.rescueAt !== null && this.recurrence && this.secondRescueAt === null
        && tick - this.rescueAt >= HYPOGLYCEMIA_TAKEOVER_TICKS)) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'This practice branch stops with instructor takeover because severe hypoglycemia remained untreated. No death, neurologic outcome, or real treatment deadline is predicted. End the session to review the missed decision, then try again.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): HypoglycemiaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended) this.choiceFeedback = id.endsWith('refused') || id === 'unsafe-oral-choice' || id === 'premature-closure' ? message : null;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart to try another approach.');
    switch (action) {
      case 'check-glucose':
        if (this.measuredAt === tick) return events;
        this.measuredGlucose = this.glucose; this.measuredAt = tick;
        if (!this.recurrence && !this.firstResponse) this.initialCheck = true;
        if (this.firstResponse && !this.recurrence) this.firstRecheck = true;
        if (this.secondResponse) this.secondRecheck = true;
        return emit(this.secondResponse ? 'second-recheck' : this.recurrence ? 'recurrent-check' : this.firstResponse ? 'first-recheck' : 'initial-check', `Simulated bedside glucose: ${this.glucose} mg/dL. Interpret it with current alertness, swallowing safety, and the treatment clock.`);
      case 'call-support':
        if (this.support) return events;
        this.support = true;
        return emit('support-called', 'Qualified medical, nursing, airway, glucose-rescue, and monitoring support is active in this fictional scene.');
      case 'oral-glucose':
        return emit('unsafe-oral-choice', 'Oral glucose was not given. The current branch requires qualified reassessment of swallowing safety; giving oral treatment to a drowsy person risks aspiration. Choose the qualified parenteral rescue pathway.');
      case 'iv-rescue':
        if (!this.support || !this.initialCheck) return emit('rescue-order-refused', 'Check glucose and activate qualified support before requesting this fictional IV rescue pathway.');
        if (this.rescueAt === null) {
          this.rescueAt = tick;
          return emit('first-rescue', 'The simulated qualified team starts its IV glucose rescue pathway. No formulation, concentration, dose, access technique, or infusion rate is selected here. Recheck in 10 simulated minutes.');
        }
        if (!this.recurrence) return emit('rescue-refused', 'Do not stack another rescue before reassessing this authored response. Continue surveillance.');
        if (this.secondRescueAt !== null) return events;
        if (this.measuredAt === null || this.measuredAt < this.rescueAt + HYPOGLYCEMIA_RECURRENCE_TICKS) return emit('rescue-order-refused', 'The earlier glucose is stale. Check again after the recurrent symptoms before selecting repeat rescue.');
        this.secondRescueAt = tick;
        return emit('second-rescue', 'The simulated qualified team repeats rescue for the recurrent low-glucose state. Recheck in 10 simulated minutes and preserve cause and recurrence work.');
      case 'review-medications':
        if (this.medicationReviewed) return events;
        this.medicationReviewed = true;
        return emit('medication-reviewed', 'The supplied record reveals glimepiride, chronic kidney disease, and poor intake for 2 days. Qualified staff must review medication safety, nutrition, renal function, and continued monitoring. No overdose or intent is inferred.');
      case 'continue-monitoring':
        if (!this.firstRecheck && !this.secondRecheck) return emit('monitoring-order-refused', 'Obtain a post-rescue glucose check before moving into recurrence surveillance.');
        if (this.monitoring) return events;
        this.monitoring = true;
        return emit('monitoring-continued', 'Continue supervised glucose and neurologic surveillance, with nutrition and medication review. The patient clock keeps running; a reassuring result is not durable recovery.');
      case 'close-case':
        this.monitoring = false;
        return emit('premature-closure', 'The monitoring plan was closed too early. The patient clock and medication-related risk continue. You can resume monitoring and reassess; this lesson does not grant discharge permission.');
      case 'handoff':
        if (!this.secondRecheck || !this.monitoring || !this.medicationReviewed) return emit('handoff-refused', 'Before handoff, verify the repeat-rescue result, review the medication and intake risks, and keep monitoring active.');
        this.ended = 'handoff';
        return emit('handoff', 'Handoff accepted with continued supervised monitoring, medication and kidney review, nutrition, prevention education, and recurrence-risk ownership. The practice stops here without claiming safe discharge or durable neurologic recovery.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional hypoglycemia lesson. Nothing changed.');
    }
  }

  snapshot(tick: number): SevereHypoglycemiaSnapshot {
    const due = this.secondRescueAt ?? this.rescueAt;
    const waiting = due !== null && !(this.secondRescueAt !== null ? this.secondResponse : this.firstResponse);
    return {
      choiceFeedback: this.choiceFeedback,
      glucoseMgPerDl: this.measuredGlucose, measuredAtTick: this.measuredAt,
      consciousness: (this.secondResponse || (this.firstResponse && !this.recurrence)) ? 'more-alert' : this.deteriorated && this.rescueAt === null ? 'hard-to-rouse' : 'drowsy',
      supportActive: this.support, medicationReviewed: this.medicationReviewed,
      monitoringActive: this.monitoring, firstRescueAtTick: this.rescueAt,
      secondRescueAtTick: this.secondRescueAt, firstRecheckComplete: this.firstRecheck,
      secondRecheckComplete: this.secondRecheck, recurrenceActive: this.recurrence && !this.secondResponse,
      recheckDueInSeconds: waiting ? Math.max(0, Math.ceil((due + HYPOGLYCEMIA_RECHECK_TICKS - tick) / TICKS_PER_SECOND)) : null,
      ended: this.ended, authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
