import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { HypercalcemiaSnapshot } from '@platform/kernel/protocol';
export type { HypercalcemiaSnapshot } from '@platform/kernel/protocol';

// Authored observation checkpoints, not treatment deadlines or drug kinetics.
export const HYPERCALCEMIA_FLUID_RESPONSE_TICKS = 15 * 60 * TICKS_PER_SECOND;
export const HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS = 4 * 60 * 60 * TICKS_PER_SECOND;
export const HYPERCALCEMIA_DELAY_TICKS = 15 * 60 * TICKS_PER_SECOND;
export const HYPERCALCEMIA_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const HYPERCALCEMIA_SESSION_TICKS = 6 * 60 * 60 * TICKS_PER_SECOND;
export type HypercalcemiaAction = 'call-support' | 'assess-cardiorenal' | 'tailored-fluids' | 'calcitonin'
  | 'antiresorptive' | 'reassess' | 'handoff' | 'unrestricted-fluids' | 'routine-diuretic' | 'wait-for-cause';
export interface HypercalcemiaEvent { readonly id: string; readonly message: string }
type HypercalcemiaVitals = Omit<NonNullable<HypercalcemiaSnapshot['observation']>, 'atTick'>;

export function supportsHypercalcemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypercalcemic-crisis-volume-and-bridge'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'hypercalcemia').length === 1
    && scenario.timeline.filter((event) => event.target === 'hypercalcemia-boundary').length === 1;
}

/** Qualified-team decisions for supplied malignancy-associated hypercalcemia.
 * No fluid prescription, drug selection, renal-clearance model, or recovery prediction.
 */
export class Hypercalcemia {
  private support = false;
  private cardiorenalAt: number | null = null;
  private fluidsAt: number | null = null;
  private calcitoninAt: number | null = null;
  private antiresorptiveAt: number | null = null;
  private delayed = false;
  private unrestrictedFluids = false;
  private routineDiuretic = false;
  private waitedForCause = false;
  private fluidResponded = false;
  private bridgeResponded = false;
  private fluidObserved = false;
  private bridgeObserved = false;
  private observation: HypercalcemiaSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: HypercalcemiaSnapshot['ended'] = null;

  advance(tick: number): HypercalcemiaEvent[] {
    if (this.ended) return [];
    const events: HypercalcemiaEvent[] = [];
    const urgentMissing = this.fluidsAt === null || this.calcitoninAt === null;
    if (urgentMissing && tick >= HYPERCALCEMIA_DELAY_TICKS && !this.delayed) {
      this.delayed = true;
      events.push({ id: 'urgent-treatment-delay', message: 'At the authored 15-minute checkpoint, tailored hydration or the short-term calcium-lowering bridge remains missing. The omission stays in the learning record. This teaching checkpoint is not a safe delay or a prediction of deterioration.' });
    }
    if (!this.fluidResponded && this.fluidsAt !== null && tick - this.fluidsAt >= HYPERCALCEMIA_FLUID_RESPONSE_TICKS) {
      this.fluidResponded = true;
      events.push({ id: 'fluid-response', message: 'The authored 15-minute hydration checkpoint shows improved circulation under monitored support. It does not establish calcium correction, renal recovery, or safe unrestricted fluids. Request a fresh assessment of perfusion and fluid tolerance.' });
    }
    if (!this.bridgeResponded && this.calcitoninAt !== null && tick - this.calcitoninAt >= HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS) {
      this.bridgeResponded = true;
      events.push({ id: 'bridge-response', message: 'The authored 4-hour calcitonin-bridge checkpoint is ready for a fresh supplied calcium assessment. Obtain a new result; this checkpoint is not an individualized drug-response prediction or proof that antiresorptive treatment has worked.' });
    }
    if ((urgentMissing && tick >= HYPERCALCEMIA_TAKEOVER_TICKS) || tick >= HYPERCALCEMIA_SESSION_TICKS) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: urgentMissing
        ? 'Instructor takeover ends the branch with tailored hydration or bridge treatment missing. This 30-minute teaching stop is not a clinical deadline or an injury prediction.'
        : 'Instructor takeover ends the unfinished 6-hour rehearsal. Review the remaining cardiorenal assessment, support, antiresorptive care, fresh observations, or handoff; this limit does not predict clinical outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): HypercalcemiaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'call-support':
        if (this.support) return events;
        this.support = true;
        return emit('support', 'Qualified emergency, endocrine, oncology, nursing, and renal support is active. Severe malignancy-associated hypercalcemia needs coordinated treatment, monitoring, and an underlying-cancer plan.');
      case 'assess-cardiorenal':
        if (this.cardiorenalAt !== null) return events;
        this.cardiorenalAt = tick;
        return emit('cardiorenal-assessment', 'The qualified team reviews supplied dehydration, HFpEF, CKD stage 3b, and creatinine 2.2 mg/dL compared with baseline 1.4 mg/dL. These findings require individualized fluid monitoring and renal-informed antiresorptive selection. No new laboratory result or completed hydration is needed to review them.');
      case 'tailored-fluids':
        if (this.fluidsAt !== null) return events;
        this.fluidsAt = tick;
        return emit('tailored-fluids', 'Qualified, monitored isotonic hydration begins with immediate volume and cardiac assessment. HFpEF and kidney impairment require reassessment of perfusion, breathing, fluid balance, and overload risk. No fixed fluid load, rate, or completed rehydration is inferred.');
      case 'calcitonin':
        if (this.calcitoninAt !== null) return events;
        this.calcitoninAt = tick;
        return emit('calcitonin', 'Qualified short-term calcitonin bridge treatment begins alongside hydration and antiresorptive planning. Its effect is temporary; clinical guidance limits use to 48–72 hours because response diminishes. No dose or immediate calcium correction is simulated.');
      case 'antiresorptive':
        if (this.antiresorptiveAt !== null) return events;
        if (this.cardiorenalAt === null) return emit('antiresorptive-review-refused', 'Antiresorptive treatment was not started. Review the supplied cardiorenal findings so the qualified team can select renal-informed treatment. This does not require waiting for new laboratory results, completed hydration, or the bridge response.');
        this.antiresorptiveAt = tick;
        return emit('antiresorptive', 'Qualified renal-informed antiresorptive treatment begins. Specific drug selection and dosing are outside this lesson. Its later effect cannot be inferred from an early request or the calcitonin checkpoint; ongoing calcium and electrolyte monitoring remains necessary.');
      case 'unrestricted-fluids':
        this.unrestrictedFluids = true;
        return emit('unrestricted-fluids-refused', 'An unrestricted fluid load was not delivered. Dehydration requires treatment, but HFpEF and kidney impairment make individualized hydration and repeated fluid-tolerance assessment essential. The attempted shortcut remains recorded.');
      case 'routine-diuretic':
        this.routineDiuretic = true;
        return emit('routine-diuretic-refused', 'Routine calcium-lowering diuresis was not given. It can worsen volume depletion and does not replace rehydration. This is not a ban on diuretics: qualified clinicians may use them for fluid overload when appropriate.');
      case 'wait-for-cause':
        if (this.fluidsAt !== null && this.calcitoninAt !== null) return emit('action-refused', 'Both urgent hydration and bridge pathways have already started. Waiting before beginning them is no longer the current decision.');
        this.waitedForCause = true;
        return emit('cause-delay-choice', 'Do not defer the remaining urgent treatment while awaiting a complete cause workup in this supplied severe malignancy-associated hypercalcemia. Qualified treatment and investigation proceed together.');
      case 'reassess': {
        const current = this.vitals(); this.observation = { atTick: tick, ...current };
        if (this.fluidResponded) this.fluidObserved = true;
        if (this.bridgeResponded) this.bridgeObserved = true;
        return emit(this.bridgeResponded ? 'bridge-reassessment' : this.fluidResponded ? 'fluid-reassessment' : 'early-reassessment',
          `Fresh fictional assessment: BP ${current.systolicMmHg}/${current.diastolicMmHg} mmHg, HR ${current.heartRateBpm}/min, RR ${current.respiratoryRateBpm}/min, SpO₂ ${current.spo2Percent}%, temperature ${current.coreTemperatureC}°C, supplied adjusted calcium ${current.adjustedCalciumMgDl} mg/dL; ${current.alertness}. ${current.fluidTolerance} Severe hypercalcemia and the underlying cancer remain active; a better circulation reading is not calcium normalization.`);
      }
      case 'handoff':
        if (!this.support || this.cardiorenalAt === null || this.fluidsAt === null || this.calcitoninAt === null
          || this.antiresorptiveAt === null || !this.fluidObserved || !this.bridgeObserved) {
          return emit('handoff-refused', 'Keep the episode open until qualified support, cardiorenal review, hydration, bridge and antiresorptive care, and fresh observations of both responses are recorded.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns ongoing fluid-tolerance and renal monitoring, serial calcium and electrolytes, the time-limited bridge, pending antiresorptive effects, and malignancy treatment. Escalate persistent severe disease or fluid intolerance for qualified renal and critical-care review. This ends the rehearsal, not the illness; recovery and discharge readiness are not established.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional hypercalcemia lesson. Nothing changed.');
    }
  }

  vitals(): HypercalcemiaVitals {
    return { ...(this.fluidResponded
      ? { systolicMmHg: 106, diastolicMmHg: 64, meanArterialMmHg: 78, heartRateBpm: 96, respiratoryRateBpm: 18 }
      : { systolicMmHg: 96, diastolicMmHg: 60, meanArterialMmHg: 72, heartRateBpm: 108, respiratoryRateBpm: 20 }),
    spo2Percent: 96, coreTemperatureC: 36.8, adjustedCalciumMgDl: this.bridgeResponded ? 14.8 : 16.4,
    alertness: 'confused; severe hypercalcemia remains active',
    fluidTolerance: this.fluidResponded
      ? 'No new fluid-overload signs in this authored observation; monitoring continues.'
      : 'Dehydration with HFpEF and kidney impairment requires careful fluid-tolerance assessment.' };
  }

  snapshot(tick: number): HypercalcemiaSnapshot {
    return { supportActive: this.support, cardiorenalAssessedAtTick: this.cardiorenalAt, fluidsAtTick: this.fluidsAt,
      calcitoninAtTick: this.calcitoninAt, antiresorptiveAtTick: this.antiresorptiveAt,
      fluidDueInSeconds: !this.ended && this.fluidsAt !== null && !this.fluidResponded
        ? Math.max(0, Math.ceil((this.fluidsAt + HYPERCALCEMIA_FLUID_RESPONSE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      bridgeDueInSeconds: !this.ended && this.calcitoninAt !== null && !this.bridgeResponded
        ? Math.max(0, Math.ceil((this.calcitoninAt + HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS - tick) / TICKS_PER_SECOND)) : null,
      fluidResponseObserved: this.fluidObserved, bridgeResponseObserved: this.bridgeObserved, urgentTreatmentDelayed: this.delayed,
      unrestrictedFluidsAttempted: this.unrestrictedFluids, routineDiureticAttempted: this.routineDiuretic, waitForCauseChosen: this.waitedForCause,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness, choiceFeedback: this.feedback,
      ended: this.ended, authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
