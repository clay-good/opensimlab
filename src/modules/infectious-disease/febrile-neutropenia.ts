import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { FebrileNeutropeniaSnapshot } from '@platform/kernel/protocol';
export type { FebrileNeutropeniaSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not a validated biological cliff or a safe waiting period.
export const FEBRILE_NEUTROPENIA_DELAY_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const FEBRILE_NEUTROPENIA_RESPONSE_TICKS = 150 * 60 * TICKS_PER_SECOND;
// Takeover sits after the untreated contrast so a learner who does nothing still sees it.
export const FEBRILE_NEUTROPENIA_TAKEOVER_TICKS = 300 * 60 * TICKS_PER_SECOND;
export const FEBRILE_NEUTROPENIA_SESSION_TICKS = 12 * 60 * 60 * TICKS_PER_SECOND;
export const FEBRILE_NEUTROPENIA_ACTIONS = ['recognize-neutropenic-fever', 'activate-pathway',
  'request-cultures', 'record-antimicrobial-intent', 'review-boundaries', 'monitor',
  'check-labs', 'check-observations', 'reassess', 'handoff',
  'crp-reassures', 'score-defers-antimicrobials', 'wait-for-source', 'expect-leukocytosis'] as const;
export type FebrileNeutropeniaAction = typeof FEBRILE_NEUTROPENIA_ACTIONS[number];
export interface FebrileNeutropeniaEvent { readonly id: string; readonly message: string }

export function supportsFebrileNeutropenia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'febrile-neutropenia-blind-examination'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'febrile-neutropenia').length === 1
    && scenario.timeline.filter((event) => event.target === 'febrile-neutropenia-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'febrile-neutropenia-boundary').length === 1;
}

/**
 * The examination is blind, so the pathway carries the safety. Neutropenia removes the local,
 * neutrophil-dependent signs a clinician would normally rely on; it does not remove the infection,
 * and it does not blunt the systemic acute-phase response, which merely lags.
 */
export class FebrileNeutropenia {
  private recognitionAt: number | null = null;
  private pathwayAt: number | null = null;
  private culturesAt: number | null = null;
  private antimicrobialAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private deteriorated = false;
  private responseChecked = false;
  private untreatedObserved = false;
  private treatedObserved = false;
  private crpReassuranceAttempted = false;
  private scoreDeferralAttempted = false;
  private sourceWaitAttempted = false;
  private leukocytosisExpected = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private labObservation: FebrileNeutropeniaSnapshot['labObservation'] = null;
  private observationsOnly: FebrileNeutropeniaSnapshot['observationsOnly'] = null;
  private observation: FebrileNeutropeniaSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: FebrileNeutropeniaSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.vitals(), this.labs()]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): FebrileNeutropeniaEvent[] {
    if (this.ended) return [];
    const terminal = this.antimicrobialAt === null && this.pathwayAt === null
      ? FEBRILE_NEUTROPENIA_TAKEOVER_TICKS : FEBRILE_NEUTROPENIA_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: FebrileNeutropeniaEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.deteriorated && this.antimicrobialAt === null && until >= FEBRILE_NEUTROPENIA_DELAY_TICKS) {
      due.push({ at: FEBRILE_NEUTROPENIA_DELAY_TICKS, apply: () => {
        this.change(() => { this.deteriorated = true; });
        events.push({ id: 'clinical-deterioration', message: 'The authored untreated contrast arrives. Temperature has fallen rather than risen, perfusion is failing, and the white cell count has not climbed because there are no neutrophils to climb with. Falling temperature and an absent leucocytosis are consistent with worsening infection here, not evidence against it. This teaching clock is not a validated biological cliff or a safe waiting period.' });
      } });
    }
    if (this.antimicrobialAt !== null && !this.responseChecked
      && until >= this.antimicrobialAt + FEBRILE_NEUTROPENIA_RESPONSE_TICKS) {
      due.push({ at: this.antimicrobialAt + FEBRILE_NEUTROPENIA_RESPONSE_TICKS, apply: () => {
        this.change(() => { this.responseChecked = true; });
        events.push({ id: 'response-checkpoint', message: 'The authored post-treatment assessment is ready. Request current observations and laboratory evidence together. The patient remains profoundly neutropenic, no organism is identified, and elapsed time establishes neither a source, marrow recovery, nor safety for discharge.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review recognition, pathway activation, culture sampling, bounded antimicrobial intent, and continuing surveillance. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): FebrileNeutropeniaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'recognize-neutropenic-fever':
        if (this.recognitionAt !== null) return events;
        this.recognitionAt = tick;
        return emit('neutropenic-fever-recognized', 'A single fever with a neutrophil count of 0.2 x10^9/L ten days after chemotherapy is a medical emergency, however well the patient looks. Neutropenia removes the local signs you would normally hunt for: pus cannot form, redness and swelling are muted, and imaging can stay clear. Around three in five episodes never localize at all, and most still turn out to be infection.');
      case 'activate-pathway':
        if (this.pathwayAt !== null) return events;
        this.pathwayAt = tick;
        return emit('pathway-activated', 'The neutropenic sepsis pathway and the acute oncology team are activated and the clock is recorded from arrival. Activation is the emergency response itself, not an administrative step that follows a decision, and it does not wait for a source, an image, or a score.');
      case 'request-cultures':
        if (this.culturesAt !== null) return events;
        this.culturesAt = tick;
        return emit('cultures-requested', 'Blood cultures are requested from a peripheral site and from each indwelling line lumen, arranged so they do not delay empiric therapy. No result is interpreted here, and a negative culture would not retrospectively make this a non-emergency.');
      case 'record-antimicrobial-intent':
        if (this.antimicrobialAt !== null) return events;
        this.change(() => { this.antimicrobialAt = tick; });
        return emit('antimicrobial-intent', 'Bounded qualified-team intent is recorded for immediate empiric intravenous broad-spectrum antimicrobial therapy according to the local protocol. Guidelines delegate the agent to local microbiology policy, so no drug, dose, route, or combination is selected here, and the recorded intent is not proof the first dose reached the patient.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries: the widely quoted one-hour target is a system-design safety margin, defended because you cannot tell at the door who is deteriorating, not a validated biological threshold; the United Kingdom guidance says immediately and states no number at all, and the timing evidence specific to this population is sparse and conflicting. Risk scores stratify disposition after the emergency response has begun and are not validated to decide whether to give antimicrobials at all; the common score is not validated in children, and the newer one is not validated in blood cancers or unstable patients. C-reactive protein takes many hours to rise and is uninformative at the door. This field is still running on guidance published between 2010 and 2018.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous observation continues with a track-and-trigger score, because a well-appearing neutropenic patient can decline quickly and the examination will not warn you first. A laboratory-only result or an observations-only round does not refresh the full assessment.');
      case 'check-labs':
        this.labObservation = this.labFinding(tick);
        return emit('lab-check', `Requested fictional laboratory evidence: neutrophils ${this.labObservation.absoluteNeutrophilsX109L.toFixed(1)} x10^9/L; white cells ${this.labObservation.whiteCellsX109L.toFixed(1)} x10^9/L; platelets ${this.labObservation.plateletsX109L} x10^9/L; C-reactive protein ${this.labObservation.crpMgL} mg/L; lactate ${this.labObservation.lactateMmolL.toFixed(1)} mmol/L. The white cell count cannot rise without neutrophils, and the marker lags by hours. This partial result supplies no current observations.`);
      case 'check-observations':
        this.observationsOnly = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: temperature ${this.observationsOnly.coreTemperatureC.toFixed(1)} C; heart rate ${this.observationsOnly.heartRateBpm}/min; BP ${this.observationsOnly.systolicMmHg}/${this.observationsOnly.diastolicMmHg} mmHg; respiratory rate ${this.observationsOnly.respiratoryRateBpm}/min; capillary refill ${this.observationsOnly.capillaryRefillSeconds} s. This partial round supplies no new laboratory evidence.`);
      case 'reassess': {
        this.labObservation = this.labFinding(tick);
        this.observationsOnly = this.observationFinding(tick);
        this.observation = { ...this.labObservation, ...this.observationsOnly, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.responseChecked) this.treatedObserved = true;
        else if (this.deteriorated) this.untreatedObserved = true;
        const view = this.observation;
        return emit(this.responseChecked ? 'treated-reassessment' : this.deteriorated ? 'untreated-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: temperature ${view.coreTemperatureC.toFixed(1)} C; heart rate ${view.heartRateBpm}/min; BP ${view.systolicMmHg}/${view.diastolicMmHg} mmHg (MAP ${view.meanArterialMmHg}); respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}%; capillary refill ${view.capillaryRefillSeconds} s; ${view.alertness}. Neutrophils ${view.absoluteNeutrophilsX109L.toFixed(1)} x10^9/L; C-reactive protein ${view.crpMgL} mg/L; lactate ${view.lactateMmolL.toFixed(1)} mmol/L. ${this.responseChecked ? 'The rising marker reflects its lag catching up, not treatment failure, and the patient is still profoundly neutropenic.' : 'Recorded intent is not a delivered first dose.'} No source, organism, marrow recovery, or discharge readiness is established.`);
      }
      case 'crp-reassures':
        this.crpReassuranceAttempted = true;
        return emit('crp-reassurance-refused', 'Treating the modest C-reactive protein as reassurance was refused. The marker takes many hours to rise and has essentially no discriminating value at the door; a normal value here means the clock has not run, not that the patient is well.');
      case 'score-defers-antimicrobials':
        this.scoreDeferralAttempted = true;
        return emit('score-deferral-refused', 'Using a low-risk score to defer empiric therapy was refused. These scores stratify disposition after the emergency response has already begun; none is validated to decide whether antimicrobials are given, and low-risk strata still carry real complication rates.');
      case 'wait-for-source':
        this.sourceWaitAttempted = true;
        return emit('source-wait-refused', 'Waiting for a localizing sign or an image before escalating was refused. Neutropenia is precisely what removes those signs, and most episodes never localize; waiting for the examination to declare itself is waiting for something that may never come.');
      case 'expect-leukocytosis':
        this.leukocytosisExpected = true;
        return emit('leukocytosis-refused', 'Reading the absent white-cell rise as evidence against infection was refused. This patient has no neutrophils with which to mount a count, so a flat or falling white cell count is expected and is not reassurance.');
      case 'handoff':
        if (this.recognitionAt === null || this.pathwayAt === null || this.culturesAt === null
          || this.antimicrobialAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record recognition, pathway activation, culture sampling, bounded antimicrobial intent, the boundary review, surveillance, and a current full assessment. A source, an organism, a risk score, and a falling marker are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns current observations and laboratory evidence, delivered empiric therapy and its review once cultures return, the continuing neutropenia, daily reassessment, and the search for a source that may never be found. Practice ends, not treatment, and neither a source, marrow recovery, nor discharge readiness is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional febrile neutropenia lesson. No care was started.');
    }
  }

  private labFinding(tick: number) {
    const values = this.responseChecked
      ? { absoluteNeutrophilsX109L: 0.1, whiteCellsX109L: 0.6, plateletsX109L: 82, crpMgL: 126, lactateMmolL: 1.9 }
      : this.deteriorated
        ? { absoluteNeutrophilsX109L: 0.1, whiteCellsX109L: 0.5, plateletsX109L: 74, crpMgL: 118, lactateMmolL: 3.9 }
        : { absoluteNeutrophilsX109L: 0.2, whiteCellsX109L: 0.8, plateletsX109L: 96, crpMgL: 42, lactateMmolL: 1.8 };
    return { atTick: tick, ...values };
  }

  private observationFinding(tick: number) {
    const { heartRateBpm, systolicMmHg, diastolicMmHg, respiratoryRateBpm, coreTemperatureC } = this.vitals();
    return { atTick: tick, heartRateBpm, systolicMmHg, diastolicMmHg, respiratoryRateBpm, coreTemperatureC,
      capillaryRefillSeconds: this.responseChecked ? 2 : this.deteriorated ? 4 : 2 };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    const circulation = this.responseChecked
      ? { heartRateBpm: 96, systolicMmHg: 112, diastolicMmHg: 68, meanArterialMmHg: 83, respiratoryRateBpm: 18, spo2Percent: 97, coreTemperatureC: 37.6 }
      : this.deteriorated
        ? { heartRateBpm: 128, systolicMmHg: 86, diastolicMmHg: 48, meanArterialMmHg: 61, respiratoryRateBpm: 26, spo2Percent: 93, coreTemperatureC: 36.1 }
        : { heartRateBpm: 104, systolicMmHg: 118, diastolicMmHg: 72, meanArterialMmHg: 87, respiratoryRateBpm: 20, spo2Percent: 97, coreTemperatureC: 38.4 };
    return { ...circulation,
      alertness: this.responseChecked ? 'alert and comfortable'
        : this.deteriorated ? 'drowsy with mottled knees' : 'well-appearing and fully alert' };
  }

  private labs() { return this.labFinding(0); }

  snapshot(tick: number): FebrileNeutropeniaSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return {
      recognitionAtTick: this.recognitionAt, pathwayAtTick: this.pathwayAt, culturesAtTick: this.culturesAt,
      antimicrobialIntentAtTick: this.antimicrobialAt, boundariesReviewedAtTick: this.boundariesAt,
      monitoringAtTick: this.monitoringAt,
      responseDueInSeconds: !this.ended && this.antimicrobialAt !== null && !this.responseChecked
        ? remaining(this.antimicrobialAt, FEBRILE_NEUTROPENIA_RESPONSE_TICKS) : null,
      untreatedResponseObserved: this.untreatedObserved, treatedResponseObserved: this.treatedObserved,
      crpReassuranceAttempted: this.crpReassuranceAttempted,
      scoreDeferralAttempted: this.scoreDeferralAttempted,
      sourceWaitAttempted: this.sourceWaitAttempted,
      leukocytosisExpected: this.leukocytosisExpected,
      labObservation: this.labObservation ? { ...this.labObservation } : null,
      observationsOnly: this.observationsOnly ? { ...this.observationsOnly } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
