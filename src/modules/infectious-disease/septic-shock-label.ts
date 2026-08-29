import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { SepticShockLabelSnapshot } from '@platform/kernel/protocol';
export type { SepticShockLabelSnapshot } from '@platform/kernel/protocol';

/**
 * Septic shock is the one label a bedside cannot read off the patient: it requires vasopressor
 * dependence and a lactate above two *after* fluid resuscitation, and the task force that wrote it
 * declined to define what makes resuscitation adequate. The label is therefore constituted by the
 * therapeutic trial, so this lesson refuses to let the learner apply it on arrival.
 */
export const SEPTIC_SHOCK_LABEL_CEILING_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const SEPTIC_SHOCK_LABEL_TRIAL_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const SEPTIC_SHOCK_LABEL_TAKEOVER_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const SEPTIC_SHOCK_LABEL_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const SEPTIC_SHOCK_LABEL_ACTIONS = ['record-hypoperfusion', 'activate-critical-care',
  'record-classification-open', 'record-resuscitation-intent', 'review-boundaries', 'monitor',
  'check-labs', 'check-perfusion', 'reassess', 'handoff',
  'declare-shock-now', 'lactate-means-hypoxia', 'resuscitate-to-normal-lactate',
  'raise-the-map-target'] as const;
export type SepticShockLabelAction = typeof SEPTIC_SHOCK_LABEL_ACTIONS[number];
export interface SepticShockLabelEvent { readonly id: string; readonly message: string }

export function supportsSepticShockLabel(scenario: Scenario): boolean {
  return scenario.metadata.id === 'septic-shock-a-label-the-treatment-creates'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'septic-shock').length === 1
    && scenario.timeline.filter((event) => event.target === 'septic-shock-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'septic-shock-boundary').length === 1;
}

export class SepticShockLabel {
  private hypoperfusionAt: number | null = null;
  private criticalCareAt: number | null = null;
  private classificationAt: number | null = null;
  private resuscitationAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private trialComplete = false;
  private trialObserved = false;
  private ceilingPassed = false;
  private earlyLabelAttempted = false;
  private hypoxiaAttempted = false;
  private normalizationAttempted = false;
  private mapTargetAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private labObservation: SepticShockLabelSnapshot['labObservation'] = null;
  private perfusionObservation: SepticShockLabelSnapshot['perfusionObservation'] = null;
  private observation: SepticShockLabelSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: SepticShockLabelSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.vitals(), this.labs()]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): SepticShockLabelEvent[] {
    if (this.ended) return [];
    const terminal = this.resuscitationAt === null ? SEPTIC_SHOCK_LABEL_TAKEOVER_TICKS : SEPTIC_SHOCK_LABEL_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: SepticShockLabelEvent[] = [];
    if (!this.ceilingPassed && this.resuscitationAt === null && until >= SEPTIC_SHOCK_LABEL_CEILING_TICKS) {
      this.ceilingPassed = true;
      events.push({ id: 'ceiling-passed', message: 'One hour has elapsed with no bounded resuscitation intent recorded. This patient sits in the tier where antimicrobials are recommended immediately and ideally within the hour, on a strong recommendation resting on very low certainty of evidence. The ceiling is reported rather than hidden.' });
    }
    // The trial only runs once the team has been asked to run it: the label is made by the
    // treatment, so nothing can complete a resuscitation that was never intended.
    if (!this.trialComplete && this.resuscitationAt !== null
      && until >= this.resuscitationAt + SEPTIC_SHOCK_LABEL_TRIAL_TICKS) {
      this.change(() => { this.trialComplete = true; });
      events.push({ id: 'trial-complete', message: 'The qualified team reports the authored fluid resuscitation complete. The pressure is now held at a mean of 68 mmHg on vasopressor support, and the lactate remains 3.1 mmol/L. Only now can the three parts of the definition be read together: vasopressor dependence, a mean pressure held at the recommended target, and a lactate above two after resuscitation. The label did not arrive with the patient. It arrived with the treatment.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded hypoperfusion, the open classification, bounded qualified-team resuscitation intent, and what the completed trial did and did not settle. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): SepticShockLabelEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-hypoperfusion':
        if (this.hypoperfusionAt !== null) return events;
        this.hypoperfusionAt = tick;
        return emit('hypoperfusion-recorded', 'The record states what is measurable now: a mean arterial pressure of 60 mmHg, a lactate of 3.6 mmol/L, and no vasopressor running yet. That is hypoperfusion with infection suspected. It is not yet septic shock, and recording it this way is what makes the later comparison possible.');
      case 'activate-critical-care':
        if (this.criticalCareAt !== null) return events;
        this.criticalCareAt = tick;
        return emit('critical-care-activated', 'Critical care is activated on the perfusion pattern rather than on a label. Nothing about the activation waits for the classification, which is the point: the team is needed now, and the name for what they are treating can be settled afterwards.');
      case 'record-classification-open':
        if (this.classificationAt !== null) return events;
        this.classificationAt = tick;
        return emit('classification-open', 'The classification is recorded as open, with the reason. Septic shock requires vasopressors to hold a mean pressure at or above 65 mmHg and a lactate above 2 mmol/L despite adequate fluid resuscitation. Two of those cannot be evaluated before the resuscitation has happened, so the label is not withheld out of caution: it is genuinely not yet decidable.');
      case 'record-resuscitation-intent':
        if (this.resuscitationAt !== null) return events;
        this.resuscitationAt = tick;
        return emit('resuscitation-intent', `Bounded qualified-team resuscitation intent is recorded ${this.ceilingPassed ? 'after the one-hour ceiling has passed, which is reported rather than hidden' : 'inside the one-hour ceiling'}. No fluid volume, rate, vasoactive agent, dose, or endpoint is selected here. Note what follows: the trial about to run is also the measurement, so the same act both treats the patient and decides what the patient will be called.`);
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, with the grades attached rather than stripped off. An initial mean arterial pressure target of 65 mmHg over higher targets is a strong recommendation on moderate certainty, and for patients 65 or older an initial range of 60 to 65 mmHg is suggested on low certainty: the target is a floor with a tolerance band, not a proven optimum, and the evidence supports 65 over higher rather than over lower. An initial crystalloid volume is suggested in the first three hours, conditional on low certainty, hedged with an explicit warning about the harms of both under- and over-resuscitation; the volume itself is a qualified-team decision and is not stated here. Fluids first and vasopressors if hypotension persists is conditional on very low certainty, the weakest statement here, with an explicit carve-out for concurrent vasopressors in unstable shock. Serial lactate to guide resuscitation is conditional on low certainty, with the instruction to individualize after the initial bolus and monitor the decrement rather than continuing fluids until the lactate normalizes. Capillary refill time is a conditional adjunct. Corticosteroids are a conditional suggestion on low certainty; trials agree they speed shock reversal and disagree about mortality.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous perfusion monitoring continues through the resuscitation, because the trial is the measurement and an unmonitored trial measures nothing. A laboratory-only result or a perfusion-only look is useful but does not refresh the full assessment.');
      case 'check-labs':
        this.labObservation = this.labFinding(tick);
        return emit('lab-check', `Requested fictional laboratory evidence: lactate ${this.labObservation.lactateMmolL.toFixed(1)} mmol/L; white cells ${this.labObservation.whiteCellsX109L.toFixed(1)} x10^9/L; creatinine ${this.labObservation.creatinineUmolL} µmol/L; base excess ${this.labObservation.baseExcessMmolL.toFixed(1)} mmol/L. A raised lactate in sepsis is not a reading of tissue oxygen debt: adrenergically driven aerobic glycolysis and reduced hepatic clearance both contribute, so it marks illness severity through several mechanisms at once. This partial result supplies no current perfusion assessment.`);
      case 'check-perfusion':
        this.perfusionObservation = this.perfusionFinding(tick);
        return emit('perfusion-check', `Requested examination: BP ${this.perfusionObservation.systolicMmHg}/${this.perfusionObservation.diastolicMmHg} mmHg, mean ${this.perfusionObservation.meanArterialMmHg} mmHg; heart rate ${this.perfusionObservation.heartRateBpm}/min; capillary refill ${this.perfusionObservation.capillaryRefillSeconds.toFixed(1)} s; ${this.perfusionObservation.vasopressorRunning ? 'vasopressor support running, so the pressure shown is a supported pressure' : 'no vasopressor running, so the pressure shown is unsupported'}. Capillary refill is an adjunct here and has no standardized technique; lighting, room and skin temperature, and applied pressure all move it. This partial examination supplies no new laboratory evidence.`);
      case 'reassess': {
        this.labObservation = this.labFinding(tick);
        this.perfusionObservation = this.perfusionFinding(tick);
        this.observation = { ...this.labObservation, ...this.perfusionObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.trialComplete) this.trialObserved = true;
        const view = this.observation;
        return emit(this.trialComplete ? 'resuscitated-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; BP ${view.systolicMmHg}/${view.diastolicMmHg} mmHg, mean ${view.meanArterialMmHg} mmHg; lactate ${view.lactateMmolL.toFixed(1)} mmol/L; capillary refill ${view.capillaryRefillSeconds.toFixed(1)} s; ${view.alertness}. ${this.trialComplete ? 'The resuscitation is complete and the pressure is supported, so all three parts of the definition can now be read: this meets septic shock, and it did so only once the treatment had run.' : 'The resuscitation has not completed, so two of the three parts of the definition cannot yet be evaluated and the classification stays open.'} No organism, treatment effect, or outcome is established here.`);
      }
      case 'declare-shock-now':
        this.earlyLabelAttempted = true;
        return emit('early-label-refused', 'Applying the septic shock label now was refused. The definition requires vasopressors to maintain a mean pressure at or above 65 mmHg and a lactate above 2 mmol/L despite adequate fluid resuscitation. No vasopressor is running and no resuscitation has completed, so two of the three parts have no truth value yet. This is not caution; the question is genuinely not yet answerable. Note also that a lactate above 4 belongs to a national quality measure rather than to this definition, and the two are different constructs.');
      case 'lactate-means-hypoxia':
        this.hypoxiaAttempted = true;
        return emit('hypoxia-refused', 'Reading the lactate as a measure of tissue hypoxia was refused. In sepsis, adrenergically stimulated aerobic glycolysis in skeletal muscle is a substantial contributor, as is reduced hepatic clearance, so an elevated lactate is not an oxygen-debt meter. It marks illness severity through several mechanisms, and treating it as a hypoxia reading is what turns it into a fluid target.');
      case 'resuscitate-to-normal-lactate':
        this.normalizationAttempted = true;
        return emit('normalization-refused', 'Continuing fluids until the lactate normalizes was refused. Current guidance says the opposite in plain terms: individualize fluid administration after the initial bolus and monitor the lactate decrement, rather than continuing fluids until normalization is achieved. Restrictive and liberal strategies have not separated on mortality in trials, so the honest position is equipoise, not a race to a number.');
      case 'raise-the-map-target':
        this.mapTargetAttempted = true;
        return emit('map-target-refused', 'Raising the mean arterial pressure target above 65 mmHg was refused. The recommendation is explicitly comparative: 65 over higher targets. It does not establish 65 as superior to lower, and for patients 65 or older an initial range of 60 to 65 mmHg is now suggested. This patient is 71. A higher target buys more vasopressor, not more evidence.');
      case 'handoff':
        if (this.hypoperfusionAt === null || this.criticalCareAt === null || this.classificationAt === null
          || this.resuscitationAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the measured hypoperfusion, activate critical care, record the classification as open with its reason, record bounded resuscitation intent, review the boundaries, arrange monitoring, and take a current full assessment. A settled label, an identified organism, and a normalized lactate are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns fluid and vasoactive decisions, the antimicrobial pathway, source control, steroid questions, and continued monitoring. What travels is the measured state before treatment, the recorded reason the classification was open, whether resuscitation intent fell inside the one-hour ceiling, and ${this.trialObserved ? 'that the completed trial made the definition readable, so the label reflects a treatment as much as a patient' : 'that the trial had not completed, so the classification is handed over still open'}. Practice ends, not treatment, and no organism, treatment effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional septic shock lesson. No care was started.');
    }
  }

  private labFinding(tick: number) {
    const values = this.trialComplete
      ? { lactateMmolL: 3.1, whiteCellsX109L: 18.4, creatinineUmolL: 148, baseExcessMmolL: -5.2 }
      : { lactateMmolL: 3.6, whiteCellsX109L: 17.1, creatinineUmolL: 132, baseExcessMmolL: -6.1 };
    return { atTick: tick, ...values };
  }

  private perfusionFinding(tick: number) {
    const { systolicMmHg, diastolicMmHg, meanArterialMmHg, heartRateBpm } = this.vitals();
    return { atTick: tick, systolicMmHg, diastolicMmHg, meanArterialMmHg, heartRateBpm,
      capillaryRefillSeconds: this.trialComplete ? 3.2 : 4.1,
      vasopressorRunning: this.trialComplete };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // The supported pressure is the whole point: after the trial the mean is held at target by a
    // vasopressor, which is one of the three things the definition asks about.
    const circulation = this.trialComplete
      ? { heartRateBpm: 112, systolicMmHg: 98, diastolicMmHg: 54, meanArterialMmHg: 68, respiratoryRateBpm: 24, spo2Percent: 95, coreTemperatureC: 38.6 }
      : { heartRateBpm: 118, systolicMmHg: 84, diastolicMmHg: 48, meanArterialMmHg: 60, respiratoryRateBpm: 26, spo2Percent: 94, coreTemperatureC: 38.9 };
    return { ...circulation,
      alertness: this.trialComplete ? 'rousable and orientated to place' : 'drowsy but rousable' };
  }

  private labs() { return this.labFinding(0); }

  snapshot(tick: number): SepticShockLabelSnapshot {
    const remaining = (at: number) => Math.max(0, Math.ceil((at - tick) / TICKS_PER_SECOND));
    return {
      hypoperfusionAtTick: this.hypoperfusionAt, criticalCareAtTick: this.criticalCareAt,
      classificationOpenAtTick: this.classificationAt, resuscitationIntentAtTick: this.resuscitationAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      ceilingDueInSeconds: !this.ended && !this.ceilingPassed && this.resuscitationAt === null
        ? remaining(SEPTIC_SHOCK_LABEL_CEILING_TICKS) : null,
      ceilingPassed: this.ceilingPassed,
      resuscitationIntentInsideCeiling: this.resuscitationAt !== null
        && this.resuscitationAt < SEPTIC_SHOCK_LABEL_CEILING_TICKS,
      trialComplete: this.trialComplete, trialObserved: this.trialObserved,
      // Every part of the definition is reported separately, so the learner can see which ones the
      // treatment made answerable rather than being handed a single verdict.
      vasopressorDependent: this.trialComplete,
      meanPressureAtTarget: this.trialComplete,
      lactateAboveThreshold: true,
      definitionReadable: this.trialComplete,
      earlyLabelAttempted: this.earlyLabelAttempted,
      hypoxiaAttempted: this.hypoxiaAttempted,
      normalizationAttempted: this.normalizationAttempted,
      mapTargetAttempted: this.mapTargetAttempted,
      labObservation: this.labObservation ? { ...this.labObservation } : null,
      perfusionObservation: this.perfusionObservation ? { ...this.perfusionObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
