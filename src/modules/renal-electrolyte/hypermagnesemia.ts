import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalHypermagnesemiaSnapshot } from '@platform/kernel/protocol';
export type { RenalHypermagnesemiaSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not kinetics, safe waits, redosing intervals, or grading deadlines.
export const RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERMAGNESEMIA_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERMAGNESEMIA_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERMAGNESEMIA_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const RENAL_HYPERMAGNESEMIA_ACTIONS = ['stop-magnesium', 'support-breathing', 'calcium',
  'call-support', 'review-context', 'deliver-removal', 'monitor', 'check-magnesium',
  'check-neuromuscular', 'reassess', 'handoff', 'calcium-means-clearance', 'routine-diuresis'] as const;
export type RenalHypermagnesemiaAction = typeof RENAL_HYPERMAGNESEMIA_ACTIONS[number];
export interface RenalHypermagnesemiaEvent { readonly id: string; readonly message: string }

export function supportsRenalHypermagnesemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypermagnesemia-antagonism-and-removal'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-hypermagnesemia').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-hypermagnesemia-boundary').length === 1;
}

/** Respiratory support, temporary antagonism, and delivered removal have distinct authored effects. */
export class RenalHypermagnesemia {
  private stopAt: number | null = null;
  private breathingAt: number | null = null;
  private calciumAt: number | null = null;
  private lastCalciumAt: number | null = null;
  private calciumRequests = 0;
  private supportAt: number | null = null;
  private contextAt: number | null = null;
  private removalAt: number | null = null;
  private monitoringAt: number | null = null;
  private calciumExpired = false;
  private removed = false;
  private delayed = false;
  private calciumObserved = false;
  private removalObserved = false;
  private recurrenceObserved = false;
  private clearanceAttempted = false;
  private diuresisAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private magnesiumObservation: RenalHypermagnesemiaSnapshot['magnesiumObservation'] = null;
  private neuromuscularObservation: RenalHypermagnesemiaSnapshot['neuromuscularObservation'] = null;
  private observation: RenalHypermagnesemiaSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RenalHypermagnesemiaSnapshot['ended'] = null;

  private activeCalcium() { return this.lastCalciumAt !== null && !this.calciumExpired; }
  private clinicalState() { return JSON.stringify([this.vitals(), this.removed]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }
  advance(tick: number): RenalHypermagnesemiaEvent[] {
    if (this.ended) return [];
    const terminal = this.breathingAt === null && this.calciumAt === null && this.removalAt === null
      ? RENAL_HYPERMAGNESEMIA_TAKEOVER_TICKS : RENAL_HYPERMAGNESEMIA_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: RenalHypermagnesemiaEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.delayed && this.calciumAt === null && this.removalAt === null && until >= RENAL_HYPERMAGNESEMIA_DELAY_TICKS) {
      due.push({ at: RENAL_HYPERMAGNESEMIA_DELAY_TICKS, apply: () => {
        this.change(() => { this.delayed = true; });
        events.push({ id: 'clinical-deterioration', message: 'Circulatory and unsupported breathing findings worsen in this authored untreated contrast. Escalate qualified respiratory support, temporary antagonism, and removal care; the teaching clock is not a safe waiting period or a grading cutoff.' });
      } });
    }
    if (this.lastCalciumAt !== null && !this.calciumExpired && until >= this.lastCalciumAt + RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS) {
      due.push({ at: this.lastCalciumAt + RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS, apply: () => {
        this.change(() => { this.calciumExpired = true; });
        events.push({ id: 'calcium-review-checkpoint', message: 'The authored temporary-antagonism review is due. Reassess current circulation, respiratory support, neuromuscular findings, and requested magnesium. This reminder neither supplies a new laboratory result nor automatically orders repeat calcium; it does not imply deterioration after removal has responded.' });
      } });
    }
    if (this.removalAt !== null && !this.removed && until >= this.removalAt + RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS) {
      due.push({ at: this.removalAt + RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS, apply: () => {
        this.change(() => { this.removed = true; });
        events.push({ id: 'removal-checkpoint', message: 'The authored removal assessment is ready. Request current magnesium and bedside findings together. Elapsed time does not establish a normal result, restored renal clearance, durable recovery, or permission to withdraw respiratory support.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review respiratory support, temporary antagonism, source cessation, delivered removal, serial findings, and continuing ownership. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalHypermagnesemiaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'stop-magnesium':
        if (this.stopAt !== null) return events;
        this.stopAt = tick;
        return emit('magnesium-stopped', 'Stop further magnesium exposure and verify the source with the responsible team. Source cessation does not remove the existing magnesium burden or replace urgent respiratory and circulatory care.');
      case 'support-breathing':
        if (this.breathingAt !== null) return events;
        this.change(() => { this.breathingAt = tick; });
        return emit('breathing-support', 'Qualified respiratory support begins immediately, independently of calcium, removal, and administrative review. The displayed respiratory rate and oxygen saturation are supported findings, not proof of recovered spontaneous ventilation or renal clearance.');
      case 'calcium':
        if (this.lastCalciumAt === tick) return events;
        this.change(() => {
          this.calciumAt ??= tick; this.lastCalciumAt = tick; this.calciumRequests += 1; this.calciumExpired = false;
        });
        return emit('calcium-antagonism', 'Qualified calcium antagonism is delivered after clinical review. It can temporarily support circulation but does not remove magnesium or correct respiratory depression or neuromuscular weakness in this model. Repetition is individualized, not scheduled by this fictional teaching interval; no dose or route is selected.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified acute-care, renal, respiratory, pharmacy, and nursing teams share urgent treatment and continuing ownership. Care does not wait for support acknowledgment.');
      case 'review-context':
        if (this.contextAt !== null) return events;
        this.contextAt = tick;
        return emit('context-review', 'Review the supplied magnesium exposure, impaired renal clearance, symptoms, and pretreatment findings. This is a nonobstetric accumulation lesson; no new renal measurement, obstetric infusion decision, or dose is inferred.');
      case 'deliver-removal':
        if (this.removalAt !== null) return events;
        this.removalAt = tick;
        return emit('removal-care', 'Qualified magnesium-removal care is delivered with individualized renal and hemodynamic assessment. It is independent of calcium, respiratory support, and administrative clicks. This action is not merely a plan and does not prescribe a removal modality, dose, fluid load, or clearance rate.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continue respiratory, circulatory, ECG, neuromuscular, and serial magnesium assessment. A magnesium-only result or neuromuscular-only examination is useful but does not refresh the full bedside assessment.');
      case 'check-magnesium':
        this.magnesiumObservation = this.magnesiumFinding(tick);
        return emit('magnesium-check', `Requested fictional magnesium: ${this.magnesiumObservation.magnesiumMmolL.toFixed(1)} mmol/L. This partial result supplies no current neuromuscular or respiratory examination and does not certify renal recovery.`);
      case 'check-neuromuscular':
        this.neuromuscularObservation = this.neuromuscularFinding(tick);
        return emit('neuromuscular-check', `Requested examination: reflexes ${this.removed ? 'present' : 'absent'}; ${this.removed ? 'residual weakness persists' : 'severe weakness remains'}. This partial examination supplies no new magnesium or full bedside assessment.`);
      case 'reassess':
        this.magnesiumObservation = this.magnesiumFinding(tick);
        this.neuromuscularObservation = this.neuromuscularFinding(tick);
        this.observation = { ...this.magnesiumObservation, ...this.neuromuscularObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.removed) this.removalObserved = true;
        else if (this.calciumExpired) this.recurrenceObserved = true;
        else if (this.activeCalcium()) this.calciumObserved = true;
        return emit(this.removed ? 'removal-reassessment' : this.calciumExpired ? 'recurrence-reassessment'
          : this.activeCalcium() ? 'calcium-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: magnesium ${this.observation.magnesiumMmolL.toFixed(1)} mmol/L; reflexes ${this.observation.reflexesPresent ? 'present' : 'absent'}; ${this.observation.severeWeakness ? 'severe weakness' : 'residual weakness'} persists. BP ${this.observation.systolicMmHg}/${this.observation.diastolicMmHg} mmHg; respiratory rate ${this.observation.respiratoryRateBpm}/min and oxygen saturation ${this.observation.spo2Percent}%${this.breathingAt !== null ? ' with qualified respiratory support' : ', with breathing still impaired'}. Calcium antagonism is not clearance; recurrent clinical toxicity is not a new magnesium rise. No normal magnesium, renal recovery, or permission to withdraw support is established.`);
      case 'calcium-means-clearance':
        this.clearanceAttempted = true;
        return emit('calcium-clearance-refused', 'The claim that calcium clears magnesium was refused. Temporary antagonism does not remove the magnesium burden or replace respiratory support, delivered removal, and serial assessment.');
      case 'routine-diuresis':
        this.diuresisAttempted = true;
        return emit('routine-diuresis-refused', 'Automatic fluid loading or routine diuresis was not started. Impaired renal clearance and circulatory compromise require individualized qualified removal and fluid decisions; this lesson does not prescribe a universal diuretic or fluid strategy.');
      case 'handoff':
        if (this.stopAt === null || this.breathingAt === null || this.supportAt === null || this.contextAt === null
          || this.removalAt === null || this.monitoringAt === null || this.observation === null
          || this.observedPhase !== this.phase || (this.calciumAt === null && !this.removalObserved)) {
          return emit('handoff-refused', 'Record source cessation, respiratory support, support ownership, context, delivered removal, monitoring, and a current full antagonism, recurrence, or removal assessment. Calcium is not required after a removal response is actually observed. Normal magnesium, earlier panels, automatic repeat calcium, and a flawless history are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns current magnesium and bedside findings, respiratory support, source cessation, delivered removal, and continued reassessment. Removal may still be pending; weakness and support needs remain unresolved. Practice ends, not treatment, and neither normal magnesium nor restored renal clearance or discharge readiness is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional renal hypermagnesemia lesson. No care was started.');
    }
  }

  private magnesiumFinding(tick: number) { return { atTick: tick, magnesiumMmolL: this.removed ? 2.4 : 4.6 }; }
  private neuromuscularFinding(tick: number) { return { atTick: tick, reflexesPresent: this.removed, severeWeakness: !this.removed }; }
  rhythm(): 'sinus' { return 'sinus'; }
  vitals() {
    const circulation = this.removed ? { heartRateBpm: 68, systolicMmHg: 110, diastolicMmHg: 66, meanArterialMmHg: 81 }
      : this.activeCalcium() ? { heartRateBpm: 62, systolicMmHg: 104, diastolicMmHg: 60, meanArterialMmHg: 75 }
        : this.delayed && this.calciumAt === null ? { heartRateBpm: 38, systolicMmHg: 78, diastolicMmHg: 42, meanArterialMmHg: 54 }
          : { heartRateBpm: 44, systolicMmHg: 86, diastolicMmHg: 48, meanArterialMmHg: 61 };
    const breathing = this.breathingAt !== null ? { respiratoryRateBpm: 14, spo2Percent: 96 }
      : this.removed ? { respiratoryRateBpm: 10, spo2Percent: 92 }
        : this.delayed ? { respiratoryRateBpm: 6, spo2Percent: 86 } : { respiratoryRateBpm: 8, spo2Percent: 90 };
    return { ...circulation, ...breathing, coreTemperatureC: 36.3,
      alertness: this.removed ? 'awake with residual weakness' : 'drowsy' };
  }
  snapshot(tick: number): RenalHypermagnesemiaSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return { supportActive: this.supportAt !== null, stopMagnesiumAtTick: this.stopAt, breathingAtTick: this.breathingAt,
      calciumAtTick: this.calciumAt, lastCalciumAtTick: this.lastCalciumAt, calciumRequests: this.calciumRequests,
      contextReviewedAtTick: this.contextAt, removalAtTick: this.removalAt, monitoringAtTick: this.monitoringAt,
      calciumDueInSeconds: !this.ended && this.lastCalciumAt !== null && !this.calciumExpired ? remaining(this.lastCalciumAt, RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS) : null,
      removalDueInSeconds: !this.ended && this.removalAt !== null && !this.removed ? remaining(this.removalAt, RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS) : null,
      calciumResponseObserved: this.calciumObserved, removalResponseObserved: this.removalObserved,
      recurrenceObserved: this.recurrenceObserved, calciumClearanceAttempted: this.clearanceAttempted,
      routineDiuresisAttempted: this.diuresisAttempted,
      magnesiumObservation: this.magnesiumObservation ? { ...this.magnesiumObservation } : null,
      neuromuscularObservation: this.neuromuscularObservation ? { ...this.neuromuscularObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
