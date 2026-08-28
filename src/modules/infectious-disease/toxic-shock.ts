import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { ToxicShockSnapshot } from '@platform/kernel/protocol';
export type { ToxicShockSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not validated deadlines or safe waits.
export const TOXIC_SHOCK_DETERIORATION_TICKS = 4 * 60 * 60 * TICKS_PER_SECOND;
// Takeover sits after the deterioration so a learner who does nothing still sees it.
export const TOXIC_SHOCK_TAKEOVER_TICKS = 6 * 60 * 60 * TICKS_PER_SECOND;
export const TOXIC_SHOCK_SESSION_TICKS = 12 * 60 * 60 * TICKS_PER_SECOND;
export const TOXIC_SHOCK_ACTIONS = ['recognize-toxin-pattern', 'activate-critical-care',
  'request-cultures', 'record-treatment-intent', 'record-definition-status', 'review-boundaries',
  'monitor', 'check-labs', 'check-perfusion', 'reassess', 'handoff',
  'declare-confirmed', 'criteria-count-excludes', 'pending-cultures-exclude',
  'negative-cultures-mean-no-infection'] as const;
export type ToxicShockAction = typeof TOXIC_SHOCK_ACTIONS[number];
export interface ToxicShockEvent { readonly id: string; readonly message: string }

export function supportsToxicShock(scenario: Scenario): boolean {
  return scenario.metadata.id === 'toxic-shock-a-definition-that-cannot-close'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'toxic-shock').length === 1
    && scenario.timeline.filter((event) => event.target === 'toxic-shock-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'toxic-shock-boundary').length === 1;
}

/**
 * A surveillance case definition is not a bedside decision rule. One definition needs desquamation
 * that cannot exist yet; the other needs an organism that has not grown. The same pending culture
 * is therefore two mutually exclusive unknowns, and no action taken today closes either.
 */
export class ToxicShock {
  private recognitionAt: number | null = null;
  private criticalCareAt: number | null = null;
  private culturesAt: number | null = null;
  private treatmentAt: number | null = null;
  private definitionAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private deteriorated = false;
  private deteriorationObserved = false;
  private confirmationAttempted = false;
  private criteriaExclusionAttempted = false;
  private pendingCultureExclusionAttempted = false;
  private negativeCultureMisreadAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private labObservation: ToxicShockSnapshot['labObservation'] = null;
  private perfusionObservation: ToxicShockSnapshot['perfusionObservation'] = null;
  private observation: ToxicShockSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: ToxicShockSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.vitals(), this.labs()]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): ToxicShockEvent[] {
    if (this.ended) return [];
    const terminal = this.criticalCareAt === null && this.treatmentAt === null
      ? TOXIC_SHOCK_TAKEOVER_TICKS : TOXIC_SHOCK_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: ToxicShockEvent[] = [];
    if (!this.deteriorated && until >= TOXIC_SHOCK_DETERIORATION_TICKS) {
      this.change(() => { this.deteriorated = true; });
      events.push({ id: 'clinical-deterioration', message: 'The authored deterioration arrives. More criteria are now satisfied on both definitions: the creatinine has crossed one threshold and the platelets the other. Neither definition has closed. Desquamation still cannot have happened, because it belongs to a week or two from now, and the cultures still show no growth at four hours, which is uninformative rather than negative. This clock is not a validated deadline or a safe waiting period.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the pattern, qualified-team activation, culture sampling, bounded treatment intent, and the explicit record that the case definition is unmet. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): ToxicShockEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'recognize-toxin-pattern':
        if (this.recognitionAt !== null) return events;
        this.recognitionAt = tick;
        return emit('toxin-pattern-recognized', 'A young patient with diffuse macular erythroderma, mucosal hyperaemia, vomiting and diarrhoea from onset, and profound early hypotension out of proportion to any apparent source describes a toxin-mediated pattern. Recognition here is of a pattern, not of a diagnosis, and it is enough to act on.');
      case 'activate-critical-care':
        if (this.criticalCareAt !== null) return events;
        this.criticalCareAt = tick;
        return emit('critical-care-activated', 'Critical care and senior medical ownership are activated on the pattern, without waiting for a definition to close. Source control for the documented focus has already been carried out by the qualified team before this rehearsal begins and is not a learner action here.');
      case 'request-cultures':
        if (this.culturesAt !== null) return events;
        this.culturesAt = tick;
        return emit('cultures-requested', 'Blood cultures and sterile-site sampling are requested. Note what that single request means: one definition requires these to be negative, and the other requires an organism to grow from a sterile site. The same pending result is two mutually exclusive unknowns, and it will not resolve either question today.');
      case 'record-treatment-intent':
        if (this.treatmentAt !== null) return events;
        this.treatmentAt = tick;
        return emit('treatment-intent', 'Bounded qualified-team intent for antimicrobial therapy and haemodynamic support is recorded per local protocol. No agent, dose, route, combination, adjunct, fluid volume, or vasoactive choice is selected here, and the anti-toxin and immunoglobulin questions are qualified-team decisions this lesson does not expose.');
      case 'record-definition-status':
        if (this.definitionAt !== null) return events;
        this.definitionAt = tick;
        return emit('definition-status-recorded', 'The record states plainly that the case definition is unmet and why. One definition is unmet for a temporal reason: it requires desquamation one to two weeks after the rash, which cannot have happened. The other is unmet for a microbiological reason: it requires isolation of the organism, which has not grown. A re-check horizon of one to two weeks is named, and the record notes that the definition may remain unmet permanently, including if the patient dies before desquamation could occur.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries: these are surveillance case definitions, built to count cases consistently across populations, not to decide treatment at a bedside. A criteria count is not a probability. The requirement in one definition for negative blood cultures is a clause excluding other diagnoses, not evidence against infection. Cultures showing no growth at four hours are uninformative rather than negative. Reported case fatality spans a wide range across series, so no single figure is asserted here. The definitions have not been revised in over a decade despite a documented international rise in invasive infection, which changed alerting and contact management rather than the definitions themselves.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous observation continues with attention to perfusion and organ function rather than to how many criteria have accumulated. A laboratory-only result or a perfusion-only look is useful but does not refresh the full assessment.');
      case 'check-labs':
        this.labObservation = this.labFinding(tick);
        return emit('lab-check', `Requested fictional laboratory evidence: white cells ${this.labObservation.whiteCellsX109L.toFixed(1)} x10^9/L; platelets ${this.labObservation.plateletsX109L} x10^9/L; creatinine ${this.labObservation.creatinineMgDl.toFixed(1)} mg/dL; alanine aminotransferase ${this.labObservation.altUL} U/L; creatine kinase ${this.labObservation.ckUL} U/L; C-reactive protein ${this.labObservation.crpMgL} mg/L; lactate ${this.labObservation.lactateMmolL.toFixed(1)} mmol/L; cultures ${this.labObservation.culturesPending ? 'no growth so far, which is uninformative rather than negative' : 'reported'}. This partial result supplies no current perfusion assessment.`);
      case 'check-perfusion':
        this.perfusionObservation = this.perfusionFinding(tick);
        return emit('perfusion-check', `Requested examination: BP ${this.perfusionObservation.systolicMmHg}/${this.perfusionObservation.diastolicMmHg} mmHg; heart rate ${this.perfusionObservation.heartRateBpm}/min; temperature ${this.perfusionObservation.coreTemperatureC.toFixed(1)} C; diffuse macular erythroderma present; mucosal hyperaemia present; desquamation absent and cannot yet be present. This partial examination supplies no new laboratory evidence.`);
      case 'reassess': {
        this.labObservation = this.labFinding(tick);
        this.perfusionObservation = this.perfusionFinding(tick);
        this.observation = { ...this.labObservation, ...this.perfusionObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.deteriorated) this.deteriorationObserved = true;
        const view = this.observation;
        return emit(this.deteriorated ? 'deteriorated-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; BP ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.alertness}. Platelets ${view.plateletsX109L} x10^9/L; creatinine ${view.creatinineMgDl.toFixed(1)} mg/dL; alanine aminotransferase ${view.altUL} U/L; creatine kinase ${view.ckUL} U/L; lactate ${view.lactateMmolL.toFixed(1)} mmol/L. Desquamation absent. Cultures show no growth so far. ${this.deteriorated ? 'More criteria are met on both definitions and neither has closed.' : 'Neither definition is met, for two different reasons.'} No confirmed or probable classification, organism, source, prognosis, or outcome is established.`);
      }
      case 'declare-confirmed':
        this.confirmationAttempted = true;
        return emit('confirmation-refused', 'Declaring a confirmed case was refused. One definition cannot be confirmed until desquamation one to two weeks from now, and the other until an organism grows from a sterile site. Neither can be satisfied today, however unwell the patient is.');
      case 'criteria-count-excludes':
        this.criteriaExclusionAttempted = true;
        return emit('criteria-exclusion-refused', 'Excluding the diagnosis because some thresholds are not crossed was refused. A criteria count is not a probability, and these are surveillance definitions built to count cases consistently rather than to rule out disease at a bedside.');
      case 'pending-cultures-exclude':
        this.pendingCultureExclusionAttempted = true;
        return emit('pending-culture-refused', 'Treating cultures with no growth at four hours as negative was refused. That result is uninformative rather than negative, and the definition that requires an organism has simply not been answered yet.');
      case 'negative-cultures-mean-no-infection':
        this.negativeCultureMisreadAttempted = true;
        return emit('negative-culture-misread-refused', 'Reading the negative-culture requirement as evidence against infection was refused. In that definition it is a clause excluding other diagnoses, not a statement that no infection is present; the toxin, not a bloodstream organism, is what makes the patient shocked.');
      case 'handoff':
        if (this.recognitionAt === null || this.criticalCareAt === null || this.culturesAt === null
          || this.treatmentAt === null || this.definitionAt === null || this.boundariesAt === null
          || this.monitoringAt === null || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the pattern, critical-care activation, culture sampling, bounded treatment intent, the explicit definition status with its reason and re-check horizon, the boundary review, surveillance, and a current full assessment. A closed definition, a grown organism, and a criteria count are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns continuing haemodynamic and organ support, antimicrobial and adjunct decisions, source review, culture results when they return, public-health notification where applicable, and the re-check for desquamation in one to two weeks. The diagnosis is handed over explicitly open, with the reason it is open recorded. Practice ends, not treatment, and no classification, organism, or outcome is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional toxic shock lesson. No care was started.');
    }
  }

  private labFinding(tick: number) {
    const values = this.deteriorated
      ? { whiteCellsX109L: 19.2, plateletsX109L: 84, creatinineMgDl: 2.4, altUL: 140, ckUL: 1_450, crpMgL: 290, lactateMmolL: 4.6, culturesPending: true }
      : { whiteCellsX109L: 16.8, plateletsX109L: 118, creatinineMgDl: 1.9, altUL: 78, ckUL: 640, crpMgL: 210, lactateMmolL: 3.4, culturesPending: true };
    return { atTick: tick, ...values };
  }

  private perfusionFinding(tick: number) {
    const { systolicMmHg, diastolicMmHg, heartRateBpm, coreTemperatureC } = this.vitals();
    return { atTick: tick, systolicMmHg, diastolicMmHg, heartRateBpm, coreTemperatureC,
      erythroderma: true, desquamation: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    const circulation = this.deteriorated
      ? { heartRateBpm: 138, systolicMmHg: 82, diastolicMmHg: 40, meanArterialMmHg: 54, respiratoryRateBpm: 30, spo2Percent: 94, coreTemperatureC: 39.8 }
      : { heartRateBpm: 128, systolicMmHg: 88, diastolicMmHg: 44, meanArterialMmHg: 59, respiratoryRateBpm: 26, spo2Percent: 96, coreTemperatureC: 39.4 };
    return { ...circulation,
      alertness: this.deteriorated ? 'drowsy and peripherally shut down' : 'alert but distressed and flushed' };
  }

  private labs() { return this.labFinding(0); }

  snapshot(tick: number): ToxicShockSnapshot {
    const remaining = (at: number) => Math.max(0, Math.ceil((at - tick) / TICKS_PER_SECOND));
    return {
      recognitionAtTick: this.recognitionAt, criticalCareAtTick: this.criticalCareAt,
      culturesAtTick: this.culturesAt, treatmentIntentAtTick: this.treatmentAt,
      definitionStatusAtTick: this.definitionAt, boundariesReviewedAtTick: this.boundariesAt,
      monitoringAtTick: this.monitoringAt,
      deteriorationDueInSeconds: !this.ended && !this.deteriorated
        ? remaining(TOXIC_SHOCK_DETERIORATION_TICKS) : null,
      deteriorationObserved: this.deteriorationObserved,
      // Both remain false for the whole rehearsal, by construction rather than by omission.
      staphylococcalDefinitionMet: false,
      streptococcalDefinitionMet: false,
      confirmationAttempted: this.confirmationAttempted,
      criteriaExclusionAttempted: this.criteriaExclusionAttempted,
      pendingCultureExclusionAttempted: this.pendingCultureExclusionAttempted,
      negativeCultureMisreadAttempted: this.negativeCultureMisreadAttempted,
      labObservation: this.labObservation ? { ...this.labObservation } : null,
      perfusionObservation: this.perfusionObservation ? { ...this.perfusionObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
