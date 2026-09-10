import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalHypomagnesemiaSnapshot } from '@platform/kernel/protocol';
export type { RenalHypomagnesemiaSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not kinetics, safe waits, repletion schedules, or grading deadlines.
export const RENAL_HYPOMAGNESEMIA_REPLETION_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOMAGNESEMIA_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOMAGNESEMIA_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOMAGNESEMIA_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPOMAGNESEMIA_ACTIONS = ['monitor', 'stop-exposure', 'replace-magnesium',
  'call-support', 'review-context', 'review-number', 'check-magnesium', 'check-potassium',
  'reassess', 'handoff', 'potassium-alone', 'normal-number-excludes'] as const;
export type RenalHypomagnesemiaAction = typeof RENAL_HYPOMAGNESEMIA_ACTIONS[number];
export interface RenalHypomagnesemiaEvent { readonly id: string; readonly message: string }

export function supportsRenalHypomagnesemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypomagnesemia-refractory-potassium-and-the-normal-number'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-hypomagnesemia').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-hypomagnesemia-boundary').length === 1;
}

/**
 * Monitoring, exposure cessation, and qualified repletion have distinct authored effects, and the
 * response deliberately does not appear where the learner is most likely to look for it: the
 * magnesium value moves 0.78 to 0.81 while the potassium, the ionized calcium and the bedside
 * findings change. An unchanged number is not evidence that repletion failed.
 */
export class RenalHypomagnesemia {
  private monitoringAt: number | null = null;
  private stopAt: number | null = null;
  private repletionAt: number | null = null;
  private supportAt: number | null = null;
  private contextAt: number | null = null;
  private numberAt: number | null = null;
  private repleted = false;
  private delayed = false;
  private repletionObserved = false;
  private untreatedObserved = false;
  private potassiumAloneAttempted = false;
  private normalNumberAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private magnesiumObservation: RenalHypomagnesemiaSnapshot['magnesiumObservation'] = null;
  private potassiumObservation: RenalHypomagnesemiaSnapshot['potassiumObservation'] = null;
  private observation: RenalHypomagnesemiaSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RenalHypomagnesemiaSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.vitals(), this.repleted]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): RenalHypomagnesemiaEvent[] {
    if (this.ended) return [];
    const terminal = this.monitoringAt === null && this.repletionAt === null
      ? RENAL_HYPOMAGNESEMIA_TAKEOVER_TICKS : RENAL_HYPOMAGNESEMIA_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: RenalHypomagnesemiaEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.delayed && this.repletionAt === null && until >= RENAL_HYPOMAGNESEMIA_DELAY_TICKS) {
      due.push({ at: RENAL_HYPOMAGNESEMIA_DELAY_TICKS, apply: () => {
        this.change(() => { this.delayed = true; });
        events.push({ id: 'untreated-contrast', message: 'Cramping increases and the supplied QT interval lengthens further in this authored untreated contrast. Arrange monitoring, stop the suspected exposure, and request qualified magnesium repletion. The teaching clock is not a safe waiting period, a deterioration prediction, or a grading cutoff.' });
      } });
    }
    if (this.repletionAt !== null && !this.repleted && until >= this.repletionAt + RENAL_HYPOMAGNESEMIA_REPLETION_TICKS) {
      due.push({ at: this.repletionAt + RENAL_HYPOMAGNESEMIA_REPLETION_TICKS, apply: () => {
        this.change(() => { this.repleted = true; });
        events.push({ id: 'repletion-checkpoint', message: 'The authored repletion assessment is ready. Request the potassium, the ionized calcium, and the bedside findings together. Elapsed time establishes no dose, no target, no corrected total-body deficit, and no permission to stop surveillance.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review monitoring, exposure cessation, what the in-range magnesium did and did not exclude, delivered repletion, serial findings, and continuing ownership. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalHypomagnesemiaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous cardiac monitoring and qualified review of the supplied prolonged QT interval begin now, independently of repletion, the medication decision, and any repeat measurement. Monitoring watches the risk; it does not reduce it and it is not a diagnosis.');
      case 'stop-exposure':
        if (this.stopAt !== null) return events;
        this.stopAt = tick;
        return emit('exposure-stopped', 'The acid-suppression agent is stopped with the responsible team and the decision is recorded for review. Stopping a suspected contributor is not an attribution, does not replace repletion, and does not resolve a deficit that has been accumulating.');
      case 'replace-magnesium':
        if (this.repletionAt !== null) return events;
        this.repletionAt = tick;
        return emit('repletion', 'Qualified magnesium repletion is delivered with individualized assessment of the route, the renal function, and the cardiac findings. This is actual treatment rather than a plan, and it selects no product, dose, rate, or serum target.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified acute-care, renal, pharmacy, and nursing teams share the repletion decision, the medication review, and continuing surveillance. Care does not wait for support acknowledgment.');
      case 'review-context':
        if (this.contextAt !== null) return events;
        this.contextAt = tick;
        return emit('context-review', 'Review the long-term acid suppression, the months of loose stool, the two potassium replacements already given without a recorded rise, and the low ionized calcium. This supplied history supports qualified review; it establishes no cause, no drug attribution, and no malabsorption or renal diagnosis.');
      case 'review-number':
        if (this.numberAt !== null) return events;
        this.numberAt = tick;
        return emit('number-review', 'The magnesium of 0.78 mmol/L sits inside a commonly printed reference range. That does not exclude depletion, because the serum concentration is sustained from body pools, and it does not establish depletion either. The supplied fractional excretion of 1.4% is consistent with renal conservation and so points away from renal loss; it separates loss routes and is not a diagnosis, a threshold, or a repletion instruction.');
      case 'check-magnesium':
        this.magnesiumObservation = this.magnesiumFinding(tick);
        return emit('magnesium-check', `Requested fictional magnesium: ${this.magnesiumObservation.magnesiumMmolL.toFixed(2)} mmol/L. This partial result supplies no potassium, calcium, or bedside examination, and a value that barely moves is neither a normal result nor evidence that repletion failed.`);
      case 'check-potassium':
        this.potassiumObservation = this.potassiumFinding(tick);
        return emit('potassium-check', `Requested fictional potassium: ${this.potassiumObservation.potassiumMmolL.toFixed(1)} mmol/L. This partial result supplies no magnesium, calcium, QT interval, or bedside examination.`);
      case 'reassess':
        this.magnesiumObservation = this.magnesiumFinding(tick);
        this.potassiumObservation = this.potassiumFinding(tick);
        this.observation = { ...this.magnesiumObservation, ...this.potassiumFinding(tick),
          ionizedCalciumMmolL: this.repleted ? 1.14 : 1.02, qtcMs: this.repleted ? 462 : this.delayed ? 524 : 508,
          crampingPresent: !this.repleted, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.repleted) this.repletionObserved = true;
        else if (this.delayed) this.untreatedObserved = true;
        return emit(this.repleted ? 'repletion-reassessment' : this.delayed ? 'untreated-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: magnesium ${this.observation.magnesiumMmolL.toFixed(2)} mmol/L; potassium ${this.observation.potassiumMmolL.toFixed(1)} mmol/L; ionized calcium ${this.observation.ionizedCalciumMmolL.toFixed(2)} mmol/L; QTc ${this.observation.qtcMs} ms; ${this.observation.crampingPresent ? 'cramping and a positive bedside carpal sign persist' : 'cramping has settled and the bedside carpal sign is no longer elicited'}. HR ${this.observation.heartRateBpm}/min, BP ${this.observation.systolicMmHg}/${this.observation.diastolicMmHg} mmHg, ${this.observation.alertness}. The magnesium value moves very little either way; the potassium, the ionized calcium and the bedside findings are where any authored response appears. No corrected total-body deficit, cause, or discharge readiness is established.`);
      case 'potassium-alone':
        this.potassiumAloneAttempted = true;
        return emit('potassium-alone-refused', 'A third potassium replacement on its own was refused with an explanation. Two have already been given without a recorded rise. Magnesium depletion increases distal potassium secretion, so potassium given without addressing magnesium can keep being lost — and that mechanism does not make magnesium the only possible reason a potassium fails to rise. No dose, route, or target is selected here either way.');
      case 'normal-number-excludes':
        this.normalNumberAttempted = true;
        return emit('normal-number-refused', 'The claim that an in-range magnesium excludes depletion was refused. The serum concentration is held up from body pools, so a value inside the printed range does not rule depletion out. It does not rule it in either, and no threshold, cutoff, or corrected value is taught in this lesson.');
      case 'handoff':
        if (this.monitoringAt === null || this.stopAt === null || this.supportAt === null || this.contextAt === null
          || this.numberAt === null || this.repletionAt === null || this.observation === null
          || this.observedPhase !== this.phase || !this.repletionObserved) {
          return emit('handoff-refused', 'Record monitoring, exposure cessation, support ownership, context, the review of what the magnesium value excludes, delivered repletion, and a current full assessment after the repletion response is actually observed. A normal magnesium, every earlier panel, a named cause, and a flawless history are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns the repletion response, the medication decision, continuing QT surveillance, and serial potassium, calcium, and magnesium review. The deficit may be far from corrected, the cause is not established, and the magnesium value is not the measure of either. Practice ends, not treatment, and no durable recovery or discharge readiness is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional renal hypomagnesemia lesson. No care was started.');
    }
  }

  private magnesiumFinding(tick: number) { return { atTick: tick, magnesiumMmolL: this.repleted ? 0.81 : 0.78 }; }
  private potassiumFinding(tick: number) { return { atTick: tick, potassiumMmolL: this.repleted ? 3.6 : 2.7 }; }
  rhythm(): 'sinus' { return 'sinus'; }
  vitals() {
    const circulation = this.repleted
      ? { heartRateBpm: 78, systolicMmHg: 122, diastolicMmHg: 72, meanArterialMmHg: 89 }
      : this.delayed
        ? { heartRateBpm: 108, systolicMmHg: 104, diastolicMmHg: 62, meanArterialMmHg: 76 }
        : { heartRateBpm: 96, systolicMmHg: 112, diastolicMmHg: 66, meanArterialMmHg: 79 };
    return { ...circulation, respiratoryRateBpm: 16, spo2Percent: 97, coreTemperatureC: 36.6,
      alertness: this.repleted ? 'awake and oriented' : 'awake but slowed and intermittently confused' };
  }
  snapshot(tick: number): RenalHypomagnesemiaSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return { supportActive: this.supportAt !== null, monitoringAtTick: this.monitoringAt,
      stopExposureAtTick: this.stopAt, contextReviewedAtTick: this.contextAt,
      repletionAtTick: this.repletionAt, numberReviewedAtTick: this.numberAt,
      repletionDueInSeconds: !this.ended && this.repletionAt !== null && !this.repleted
        ? remaining(this.repletionAt, RENAL_HYPOMAGNESEMIA_REPLETION_TICKS) : null,
      repletionResponseObserved: this.repletionObserved, untreatedContrastObserved: this.untreatedObserved,
      potassiumAloneAttempted: this.potassiumAloneAttempted, normalNumberClaimAttempted: this.normalNumberAttempted,
      magnesiumObservation: this.magnesiumObservation ? { ...this.magnesiumObservation } : null,
      potassiumObservation: this.potassiumObservation ? { ...this.potassiumObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
