import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalRhabdomyolysisSnapshot } from '@platform/kernel/protocol';
export type { RenalRhabdomyolysisSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not kinetics, safe waits, or grading deadlines.
export const RENAL_RHABDOMYOLYSIS_SERIAL_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const RENAL_RHABDOMYOLYSIS_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const RENAL_RHABDOMYOLYSIS_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_RHABDOMYOLYSIS_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const RENAL_RHABDOMYOLYSIS_ACTIONS = ['review-cause', 'examine-compartments', 'review-number',
  'review-additions', 'arrange-fluids', 'call-support', 'monitor', 'check-creatine-kinase',
  'check-renal', 'reassess', 'handoff', 'dialyse-on-number', 'add-bicarbonate-and-mannitol'] as const;
export type RenalRhabdomyolysisAction = typeof RENAL_RHABDOMYOLYSIS_ACTIONS[number];
export interface RenalRhabdomyolysisEvent { readonly id: string; readonly message: string }

export function supportsRenalRhabdomyolysis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'rhabdomyolysis-a-number-that-does-not-carry-the-risk'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-rhabdomyolysis').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-rhabdomyolysis-boundary').length === 1;
}

/**
 * The creatine kinase rises and the kidney holds, and neither is a reward.
 *
 * The frightening number goes up across the whole rehearsal while the creatinine and the urine
 * output stay where they were, because that is the observation the lesson turns on: the value
 * that drove the disposition in the series this draws on was not the value that tracked the
 * kidney. Nothing the learner does bends either number.
 */
export class RenalRhabdomyolysis {
  private causeAt: number | null = null;
  private compartmentAt: number | null = null;
  private numberAt: number | null = null;
  private additionsAt: number | null = null;
  private fluidsAt: number | null = null;
  private supportAt: number | null = null;
  private monitoringAt: number | null = null;
  private serialOpened = false;
  private unexamined = false;
  private dialysisAttempted = false;
  private additionsAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private creatineKinaseObservation: RenalRhabdomyolysisSnapshot['creatineKinaseObservation'] = null;
  private renalObservation: RenalRhabdomyolysisSnapshot['renalObservation'] = null;
  private observation: RenalRhabdomyolysisSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RenalRhabdomyolysisSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.serialOpened, this.fluidsAt !== null, this.unexamined]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): RenalRhabdomyolysisEvent[] {
    if (this.ended) return [];
    const terminal = this.compartmentAt === null && this.fluidsAt === null
      ? RENAL_RHABDOMYOLYSIS_TAKEOVER_TICKS : RENAL_RHABDOMYOLYSIS_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: RenalRhabdomyolysisEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.unexamined && this.compartmentAt === null && until >= RENAL_RHABDOMYOLYSIS_DELAY_TICKS) {
      due.push({ at: RENAL_RHABDOMYOLYSIS_DELAY_TICKS, apply: () => {
        this.change(() => { this.unexamined = true; });
        events.push({ id: 'unexamined-contrast', message: 'The limbs have still not been examined in this authored contrast, and the discussion is still about the creatine kinase. A compartment syndrome is found at the bedside; no laboratory value rules it in or out. The teaching clock is not a safe waiting period, a deterioration prediction, or a grading cutoff.' });
      } });
    }
    if (this.fluidsAt !== null && !this.serialOpened && until >= this.fluidsAt + RENAL_RHABDOMYOLYSIS_SERIAL_TICKS) {
      due.push({ at: this.fluidsAt + RENAL_RHABDOMYOLYSIS_SERIAL_TICKS, apply: () => {
        this.change(() => { this.serialOpened = true; });
        events.push({ id: 'serial-checkpoint', message: 'The authored serial results are ready. Request the creatine kinase, the kidney findings, and the bedside examination together. Elapsed time establishes no peak, no trajectory, and no permission to stop looking at the limbs.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the cause, the compartment examination, what the creatine kinase does and does not decide, qualified fluid ownership, and serial findings. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalRhabdomyolysisEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'review-cause':
        if (this.causeAt !== null) return events;
        this.causeAt = tick;
        return emit('cause-review', 'Recorded: an unaccustomed heavy training session two days ago, with no trauma, crush, toxin, heat illness, seizure, arrest, or sepsis supplied. In the cohort behind this lesson the observed rate of replacement therapy or death ran from 3.2% for exercise to 41.2% for compartment syndrome and 58.5% after cardiac arrest. That is an observed distribution in a retrospective cohort, not a prognosis for this patient, and establishing the cause does not close the search for a second one.');
      case 'examine-compartments':
        if (this.compartmentAt !== null) return events;
        this.change(() => { this.compartmentAt = tick; });
        return emit('compartment-examination', 'Compartment examination of the thighs and shoulders is performed and recorded: pain on passive stretch, tension, distal pulses, and sensation. At this examination there is no compartment concern. This is a bedside finding that must be repeated, not a result; no creatine kinase value rules a compartment syndrome in or out, and no pressure is measured and no procedure is performed here.');
      case 'review-number':
        if (this.numberAt !== null) return events;
        this.numberAt = tick;
        return emit('number-review', 'Recorded: the supplied creatine kinase of 48,000 U/L is one variable among several, and it entered the risk model behind this lesson alongside age, sex, cause, creatinine, phosphate, calcium, and bicarbonate. In a separate series of thirty exertional cases, higher creatinine correlated with lower creatine kinase, and twenty-nine of thirty were nonetheless discharged only once the value was falling. No threshold, cutoff, dialysis criterion, or discharge criterion is taught here.');
      case 'review-additions':
        if (this.additionsAt !== null) return events;
        this.additionsAt = tick;
        return emit('additions-review', 'Recorded: across twelve studies, intravenous fluid resuscitation decreased acute renal failure and the need for dialysis, while neither bicarbonate nor mannitol improved either outcome. The authors rated that evidence very low quality and most of it retrospective, so it is an absence of demonstrated benefit rather than a demonstrated absence. It is not a reason to withhold fluid, and no volume, rate, product, or alkalinization target follows.');
      case 'arrange-fluids':
        if (this.fluidsAt !== null) return events;
        this.change(() => { this.fluidsAt = tick; });
        return emit('fluid-ownership', 'Qualified individualized fluid resuscitation is arranged and its ownership recorded, with the responsible team choosing volume, rate, product, and the targets they will follow. This lesson selects none of those, supplies no measurement of what was given, and does not claim the kidney is protected by having arranged it.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified acute-care, renal, surgical, and nursing teams share the fluid decision, the repeat compartment examination, and continuing surveillance. Care does not wait for support acknowledgment.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continue serial creatine kinase, creatinine, potassium, urine output, and repeated compartment examination. A creatine-kinase-only result or a kidney-only result is useful but does not refresh the bedside examination, which is the part no laboratory can supply.');
      case 'check-creatine-kinase':
        this.creatineKinaseObservation = this.creatineKinaseFinding(tick);
        return emit('creatine-kinase-check', `Requested fictional creatine kinase: ${this.creatineKinaseObservation.creatineKinaseUL.toLocaleString('en-US')} U/L. This partial result supplies no kidney findings and no examination, and its direction sets no treatment.`);
      case 'check-renal':
        this.renalObservation = this.renalFinding(tick);
        return emit('renal-check', `Requested fictional kidney findings: creatinine ${this.renalObservation.creatinineUmolL} µmol/L, urine output ${this.renalObservation.urineMlPerKgPerHour.toFixed(1)} mL/kg/h. This partial result supplies no creatine kinase and no examination.`);
      case 'reassess':
        this.creatineKinaseObservation = this.creatineKinaseFinding(tick);
        this.renalObservation = this.renalFinding(tick);
        this.observation = { ...this.creatineKinaseFinding(tick), ...this.renalFinding(tick),
          potassiumMmolL: 4.4, compartmentConcern: false, ...this.vitals() };
        this.observedPhase = this.phase;
        return emit(this.serialOpened ? 'serial-reassessment' : this.unexamined ? 'unexamined-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: creatine kinase ${this.observation.creatineKinaseUL.toLocaleString('en-US')} U/L; creatinine ${this.observation.creatinineUmolL} µmol/L; urine output ${this.observation.urineMlPerKgPerHour.toFixed(1)} mL/kg/h; potassium ${this.observation.potassiumMmolL} mmol/L; no compartment concern at this examination. HR ${this.observation.heartRateBpm}/min, BP ${this.observation.systolicMmHg}/${this.observation.diastolicMmHg} mmHg, ${this.observation.alertness}. The creatine kinase is higher and the kidney is unchanged. Neither establishes a peak, a trajectory, or a disposition, and the examination has to be repeated whatever the numbers do.`);
      case 'dialyse-on-number':
        this.dialysisAttempted = true;
        return emit('dialysis-refused', 'Requesting replacement therapy on the strength of the creatine kinase value was refused. It is one variable among several and no threshold for it is taught here; the creatinine, potassium, bicarbonate, and urine output are unchanged from the supplied starting values. This refusal is not a claim that this patient will never need replacement therapy, and it decides nothing about anyone else.');
      case 'add-bicarbonate-and-mannitol':
        this.additionsAttempted = true;
        return emit('additions-refused', 'Adding bicarbonate and mannitol as a routine pair was refused. Neither improved renal failure or the need for dialysis in the systematic review examined. That review rated its own evidence very low quality, so this is an absence of demonstrated benefit rather than proof they are useless, and it is a reason to leave the decision with the team that owns it rather than to add them by habit.');
      case 'handoff':
        if (this.causeAt === null || this.compartmentAt === null || this.numberAt === null
          || this.additionsAt === null || this.fluidsAt === null || this.supportAt === null
          || this.monitoringAt === null || this.observation === null
          || this.observedPhase !== this.phase || !this.serialOpened) {
          return emit('handoff-refused', 'Record the cause, the compartment examination, the review of what the creatine kinase decides, the review of bicarbonate and mannitol, qualified fluid ownership, support, monitoring, and a current full assessment once the serial results are back. A falling creatine kinase, a normal value, and a completed prognosis are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns the fluid decision, the repeated compartment examination, serial kidney and creatine kinase review, and the decision about when he leaves. The creatine kinase is still rising and the kidney is still unaffected; neither of those is the discharge criterion, and this rehearsal supplies none. Practice ends, not care, and no peak, prognosis, recovery, or discharge readiness is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional rhabdomyolysis lesson. No care was started.');
    }
  }

  // Authored and monotonic: the frightening number rises, the kidney does not follow it.
  private creatineKinaseFinding(tick: number) {
    return { atTick: tick, creatineKinaseUL: this.serialOpened ? 61000 : 48000 };
  }
  private renalFinding(tick: number) {
    return { atTick: tick, creatinineUmolL: 88, urineMlPerKgPerHour: 1.4 };
  }
  rhythm(): 'sinus' { return 'sinus'; }
  vitals() {
    return { heartRateBpm: 88, systolicMmHg: 124, diastolicMmHg: 70, meanArterialMmHg: 88,
      respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 37.1,
      alertness: 'awake, oriented, and sore' };
  }
  snapshot(tick: number): RenalRhabdomyolysisSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return { supportActive: this.supportAt !== null, causeReviewedAtTick: this.causeAt,
      compartmentExaminedAtTick: this.compartmentAt, numberReviewedAtTick: this.numberAt,
      additionsReviewedAtTick: this.additionsAt, fluidsArrangedAtTick: this.fluidsAt,
      monitoringAtTick: this.monitoringAt,
      serialDueInSeconds: !this.ended && this.fluidsAt !== null && !this.serialOpened
        ? remaining(this.fluidsAt, RENAL_RHABDOMYOLYSIS_SERIAL_TICKS) : null,
      serialOpened: this.serialOpened, unexaminedContrastObserved: this.unexamined,
      dialysisOnNumberAttempted: this.dialysisAttempted, additionsAttempted: this.additionsAttempted,
      creatineKinaseObservation: this.creatineKinaseObservation ? { ...this.creatineKinaseObservation } : null,
      renalObservation: this.renalObservation ? { ...this.renalObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
