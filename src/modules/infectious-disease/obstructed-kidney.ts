import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { ObstructedKidneySnapshot } from '@platform/kernel/protocol';
export type { ObstructedKidneySnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not validated decompression deadlines or safe waiting periods.
export const OBSTRUCTED_KIDNEY_DELAY_TICKS = 6 * 60 * 60 * TICKS_PER_SECOND;
export const OBSTRUCTED_KIDNEY_RESPONSE_TICKS = 6 * 60 * 60 * TICKS_PER_SECOND;
// Takeover must sit after the untreated six-hour contrast, or a learner who does nothing is
// stopped before the lesson's central deterioration is ever shown.
export const OBSTRUCTED_KIDNEY_TAKEOVER_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const OBSTRUCTED_KIDNEY_SESSION_TICKS = 24 * 60 * 60 * TICKS_PER_SECOND;
export const OBSTRUCTED_KIDNEY_ACTIONS = ['recognize-obstruction', 'call-urology', 'request-cultures',
  'record-decompression-intent', 'defer-stone-treatment', 'review-boundaries', 'monitor',
  'check-labs', 'check-observations', 'reassess', 'handoff',
  'antibiotics-are-enough', 'wait-for-crp', 'choose-modality', 'treat-stone-now'] as const;
export type ObstructedKidneyAction = typeof OBSTRUCTED_KIDNEY_ACTIONS[number];
export interface ObstructedKidneyEvent { readonly id: string; readonly message: string }

export function supportsObstructedKidney(scenario: Scenario): boolean {
  return scenario.metadata.id === 'obstructed-infected-kidney-decompression'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'obstructed-kidney').length === 1
    && scenario.timeline.filter((event) => event.target === 'obstructed-kidney-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'obstructed-kidney-boundary').length === 1;
}

/**
 * Antimicrobial care and source control are separate decisions with separate authored effects.
 * Recorded decompression intent never selects a modality or a time, because the evidence does not
 * establish either, and an improving patient after decompression is still an unresolved one.
 */
export class ObstructedKidney {
  private recognitionAt: number | null = null;
  private urologyAt: number | null = null;
  private culturesAt: number | null = null;
  private decompressionAt: number | null = null;
  private deferralAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private deteriorated = false;
  private responseChecked = false;
  private untreatedObserved = false;
  private decompressedObserved = false;
  private markerDelayAttempted = false;
  private antibioticsOnlyAttempted = false;
  private modalityChoiceAttempted = false;
  private earlyStoneTreatmentAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private labObservation: ObstructedKidneySnapshot['labObservation'] = null;
  private observationsOnly: ObstructedKidneySnapshot['observationsOnly'] = null;
  private observation: ObstructedKidneySnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: ObstructedKidneySnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.vitals(), this.labs()]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): ObstructedKidneyEvent[] {
    if (this.ended) return [];
    const terminal = this.decompressionAt === null && this.urologyAt === null
      ? OBSTRUCTED_KIDNEY_TAKEOVER_TICKS : OBSTRUCTED_KIDNEY_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: ObstructedKidneyEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.deteriorated && this.decompressionAt === null && until >= OBSTRUCTED_KIDNEY_DELAY_TICKS) {
      due.push({ at: OBSTRUCTED_KIDNEY_DELAY_TICKS, apply: () => {
        this.change(() => { this.deteriorated = true; });
        events.push({ id: 'clinical-deterioration', message: 'Six authored hours of appropriate antimicrobial care have passed with the collecting system still obstructed, and the patient is worse. Antimicrobials do not drain an obstructed kidney. This teaching clock is not a validated decompression deadline, a safe waiting period, or a grading cutoff.' });
      } });
    }
    if (this.decompressionAt !== null && !this.responseChecked
      && until >= this.decompressionAt + OBSTRUCTED_KIDNEY_RESPONSE_TICKS) {
      due.push({ at: this.decompressionAt + OBSTRUCTED_KIDNEY_RESPONSE_TICKS, apply: () => {
        this.change(() => { this.responseChecked = true; });
        events.push({ id: 'decompression-checkpoint', message: 'The authored post-decompression assessment is ready. Request current observations and laboratory evidence together. Drainage does not end the risk: post-decompression deterioration is well described, and elapsed time establishes neither cure, cleared infection, recovered kidney function, nor readiness for definitive stone treatment.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review obstruction recognition, urology and interventional-radiology activation, bounded decompression intent, culture sampling, deferral of definitive stone treatment, and continuing surveillance. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): ObstructedKidneyEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'recognize-obstruction':
        if (this.recognitionAt !== null) return events;
        this.recognitionAt = tick;
        return emit('obstruction-recognized', 'Fever, flank pain, systemic upset, and a supplied obstructing stone with hydronephrosis together describe an infected obstructed kidney. This is an undrained source, not a more severe pyelonephritis. Recognition is not a diagnosis and does not establish the organism, the degree of obstruction, or the kidney’s recoverable function.');
      case 'call-urology':
        if (this.urologyAt !== null) return events;
        this.urologyAt = tick;
        return emit('urology-activated', 'Urology and interventional radiology are involved early and told this is a suspected infected obstructed kidney needing urgent decompression. The receiving team seeks senior advice about the timing of intervention; the timing is theirs to set, not the referrer’s. Care does not wait for that conversation to conclude.');
      case 'request-cultures':
        if (this.culturesAt !== null) return events;
        this.culturesAt = tick;
        return emit('cultures-requested', 'Blood and urine cultures are requested, with a further sample to be taken from the collecting system at decompression, because that sample can differ from a bladder specimen. No result is interpreted here and no antimicrobial is chosen or changed.');
      case 'record-decompression-intent':
        if (this.decompressionAt !== null) return events;
        this.change(() => { this.decompressionAt = tick; });
        return emit('decompression-intent', 'Bounded qualified-team intent for urgent decompression is recorded. Percutaneous nephrostomy and retrograde ureteric stenting are both acceptable, and the qualified team selects between them on local urology and interventional-radiology resources and patient factors. No modality, access, anaesthetic, timing, or operator is chosen here, and the recorded intent is not proof the drain was placed.');
      case 'defer-stone-treatment':
        if (this.deferralAt !== null) return events;
        this.deferralAt = tick;
        return emit('stone-treatment-deferred', 'Definitive stone treatment is deferred until the infection has been treated. Decompression relieves the obstruction; it does not remove the stone, and attempting stone clearance during active infection is a separate and later decision. Urgency here is specific to drainage, not to everything.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries: no guideline states an hour threshold for decompressing an infected obstructed kidney. Urological bodies make a strong recommendation to drain urgently on low-grade evidence, while the sepsis guidance that does supply a six-hour figure grades that figure conditional on very-low-certainty evidence, derived from observational studies. Nephrostomy and stenting are not separated by outcome evidence. Inflammatory markers are not established as decision tools here. The European urological urosepsis section is currently withdrawn pending review, and the complicated-urinary-infection antibiotic evidence base rarely enrolled patients with obstruction, stones, or drains at all.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous observation with a track-and-trigger score continues at the cadence the current risk level requires, and lack of improvement after an intervention raises concern even when a single score does not. A laboratory-only result or an observations-only round is useful but does not refresh the full assessment.');
      case 'check-labs':
        this.labObservation = this.labFinding(tick);
        return emit('lab-check', `Requested fictional laboratory evidence: lactate ${this.labObservation.lactateMmolL.toFixed(1)} mmol/L; creatinine ${this.labObservation.creatinineUmolL} µmol/L; white cells ${this.labObservation.whiteCellsX109L.toFixed(1)} x10^9/L; platelets ${this.labObservation.plateletsX109L} x10^9/L; C-reactive protein ${this.labObservation.crpMgL} mg/L. C-reactive protein lags by many hours and is not established as a decompression trigger. This partial result supplies no current observations.`);
      case 'check-observations':
        this.observationsOnly = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationsOnly.heartRateBpm}/min; BP ${this.observationsOnly.systolicMmHg}/${this.observationsOnly.diastolicMmHg} mmHg; respiratory rate ${this.observationsOnly.respiratoryRateBpm}/min; temperature ${this.observationsOnly.coreTemperatureC.toFixed(1)} C; track-and-trigger score ${this.observationsOnly.trackAndTriggerScore}. This partial round supplies no new laboratory evidence.`);
      case 'reassess': {
        this.labObservation = this.labFinding(tick);
        this.observationsOnly = this.observationFinding(tick);
        this.observation = { ...this.labObservation, ...this.observationsOnly, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.responseChecked) this.decompressedObserved = true;
        else if (this.deteriorated) this.untreatedObserved = true;
        const view = this.observation;
        return emit(this.responseChecked ? 'decompressed-reassessment' : this.deteriorated ? 'undrained-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; BP ${view.systolicMmHg}/${view.diastolicMmHg} mmHg (MAP ${view.meanArterialMmHg}); respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}%; temperature ${view.coreTemperatureC.toFixed(1)} C; track-and-trigger score ${view.trackAndTriggerScore}; ${view.alertness}. Lactate ${view.lactateMmolL.toFixed(1)} mmol/L; creatinine ${view.creatinineUmolL} µmol/L; white cells ${view.whiteCellsX109L.toFixed(1)} x10^9/L; platelets ${view.plateletsX109L} x10^9/L; C-reactive protein ${view.crpMgL} mg/L. ${this.responseChecked ? 'A rising C-reactive protein alongside improving observations reflects its lag, not failed drainage.' : 'Recorded intent is not a placed drain.'} No cure, cleared infection, recovered kidney function, or discharge readiness is established.`);
      }
      case 'antibiotics-are-enough':
        this.antibioticsOnlyAttempted = true;
        return emit('antibiotics-only-refused', 'Continuing antimicrobials alone without decompression was refused. Antimicrobial therapy may be insufficient while the collecting system stays obstructed, and mortality is substantially higher in infected obstruction that is never drained.');
      case 'wait-for-crp':
        this.markerDelayAttempted = true;
        return emit('marker-delay-refused', 'Waiting for a C-reactive protein trend before escalating was refused. That marker lags by many hours, is still rising in this authored patient, and is not established as a tool for deciding or timing decompression.');
      case 'choose-modality':
        this.modalityChoiceAttempted = true;
        return emit('modality-choice-refused', 'Declaring one drainage modality correct was refused. Randomised evidence has not separated percutaneous nephrostomy from retrograde stenting on clinical outcomes; the choice belongs to the qualified team and depends on local resources and patient factors, so this lesson marks neither as the right answer.');
      case 'treat-stone-now':
        this.earlyStoneTreatmentAttempted = true;
        return emit('early-stone-treatment-refused', 'Proceeding to definitive stone treatment now was refused. Stone clearance waits until the infection has been treated; decompression and definitive treatment are separate decisions on separate clocks.');
      case 'handoff':
        if (this.recognitionAt === null || this.urologyAt === null || this.culturesAt === null
          || this.decompressionAt === null || this.deferralAt === null || this.boundariesAt === null
          || this.monitoringAt === null || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record obstruction recognition, urology and interventional-radiology activation, culture sampling, bounded decompression intent, deferral of definitive stone treatment, the boundary review, surveillance, and a current full assessment. A normal marker, a chosen modality, a settled organism, and a confirmed drain time are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns current observations and laboratory evidence, the requested decompression and its timing, collecting-system and blood culture results, antimicrobial review once an organism is known, kidney-function recovery, and the later decision about the stone itself. Deterioration after drainage remains possible. Practice ends, not treatment, and neither cure nor recovery is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional obstructed infected kidney lesson. No care was started.');
    }
  }

  private labFinding(tick: number) {
    const values = this.responseChecked
      ? { lactateMmolL: 2.1, creatinineUmolL: 176, whiteCellsX109L: 16.2, plateletsX109L: 112, crpMgL: 268 }
      : this.deteriorated
        ? { lactateMmolL: 4.2, creatinineUmolL: 212, whiteCellsX109L: 22.1, plateletsX109L: 96, crpMgL: 290 }
        : { lactateMmolL: 2.6, creatinineUmolL: 148, whiteCellsX109L: 18.4, plateletsX109L: 148, crpMgL: 210 };
    return { atTick: tick, ...values };
  }

  private observationFinding(tick: number) {
    const { heartRateBpm, systolicMmHg, diastolicMmHg, respiratoryRateBpm, coreTemperatureC } = this.vitals();
    return { atTick: tick, heartRateBpm, systolicMmHg, diastolicMmHg, respiratoryRateBpm, coreTemperatureC,
      trackAndTriggerScore: this.responseChecked ? 5 : this.deteriorated ? 15 : 8 };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    const circulation = this.responseChecked
      ? { heartRateBpm: 104, systolicMmHg: 108, diastolicMmHg: 62, meanArterialMmHg: 77, respiratoryRateBpm: 22, spo2Percent: 96, coreTemperatureC: 38.2 }
      : this.deteriorated
        ? { heartRateBpm: 132, systolicMmHg: 86, diastolicMmHg: 44, meanArterialMmHg: 58, respiratoryRateBpm: 30, spo2Percent: 93, coreTemperatureC: 39.4 }
        : { heartRateBpm: 118, systolicMmHg: 104, diastolicMmHg: 58, meanArterialMmHg: 73, respiratoryRateBpm: 26, spo2Percent: 95, coreTemperatureC: 38.9 };
    return { ...circulation,
      alertness: this.responseChecked ? 'alert and orientated'
        : this.deteriorated ? 'newly confused' : 'alert but exhausted' };
  }

  private labs() { return this.labFinding(0); }

  snapshot(tick: number): ObstructedKidneySnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return {
      recognitionAtTick: this.recognitionAt, urologyAtTick: this.urologyAt, culturesAtTick: this.culturesAt,
      decompressionIntentAtTick: this.decompressionAt, stoneDeferralAtTick: this.deferralAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      decompressionDueInSeconds: !this.ended && this.decompressionAt !== null && !this.responseChecked
        ? remaining(this.decompressionAt, OBSTRUCTED_KIDNEY_RESPONSE_TICKS) : null,
      untreatedResponseObserved: this.untreatedObserved,
      decompressedResponseObserved: this.decompressedObserved,
      antibioticsOnlyAttempted: this.antibioticsOnlyAttempted,
      markerDelayAttempted: this.markerDelayAttempted,
      modalityChoiceAttempted: this.modalityChoiceAttempted,
      earlyStoneTreatmentAttempted: this.earlyStoneTreatmentAttempted,
      labObservation: this.labObservation ? { ...this.labObservation } : null,
      observationsOnly: this.observationsOnly ? { ...this.observationsOnly } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
