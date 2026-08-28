import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { NecrotizingInfectionSnapshot } from '@platform/kernel/protocol';
export type { NecrotizingInfectionSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not a validated operative deadline or safe wait.
export const NECROTIZING_INFECTION_PROGRESSION_TICKS = 4 * 60 * 60 * TICKS_PER_SECOND;
// Takeover sits after the progression so a learner who does nothing still sees it.
export const NECROTIZING_INFECTION_TAKEOVER_TICKS = 6 * 60 * 60 * TICKS_PER_SECOND;
export const NECROTIZING_INFECTION_SESSION_TICKS = 12 * 60 * 60 * TICKS_PER_SECOND;
export const NECROTIZING_INFECTION_ACTIONS = ['recognize-disproportionate-pain', 'mark-the-margin',
  'call-surgery', 'record-antimicrobial-intent', 'review-boundaries', 'monitor',
  'check-labs', 'check-limb', 'reassess', 'handoff',
  'score-excludes', 'wait-for-imaging', 'absent-crepitus-excludes', 'continue-oral-antibiotics'] as const;
export type NecrotizingInfectionAction = typeof NECROTIZING_INFECTION_ACTIONS[number];
export interface NecrotizingInfectionEvent { readonly id: string; readonly message: string }

export function supportsNecrotizingInfection(scenario: Scenario): boolean {
  return scenario.metadata.id === 'necrotizing-infection-score-cannot-exclude'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'necrotizing-infection').length === 1
    && scenario.timeline.filter((event) => event.target === 'necrotizing-infection-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'necrotizing-infection-boundary').length === 1;
}

/**
 * A ruled-in result changes what you do; a ruled-out result here changes nothing. The disease
 * progresses on its own authored clock whatever the learner records, because the only thing that
 * treats it is an operation that happens after this rehearsal ends. What the learner changes is
 * whether the surgical team is already mobilized when it does.
 */
export class NecrotizingInfection {
  private recognitionAt: number | null = null;
  private marginAt: number | null = null;
  private surgeryAt: number | null = null;
  private antimicrobialAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private progressed = false;
  private progressionObserved = false;
  private scoreExclusionAttempted = false;
  private imagingDelayAttempted = false;
  private crepitusExclusionAttempted = false;
  private oralContinuationAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private labObservation: NecrotizingInfectionSnapshot['labObservation'] = null;
  private limbObservation: NecrotizingInfectionSnapshot['limbObservation'] = null;
  private observation: NecrotizingInfectionSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: NecrotizingInfectionSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.vitals(), this.labs()]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): NecrotizingInfectionEvent[] {
    if (this.ended) return [];
    const terminal = this.surgeryAt === null
      ? NECROTIZING_INFECTION_TAKEOVER_TICKS : NECROTIZING_INFECTION_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: NecrotizingInfectionEvent[] = [];
    if (!this.progressed && until >= NECROTIZING_INFECTION_PROGRESSION_TICKS) {
      this.change(() => { this.progressed = true; });
      events.push({ id: 'clinical-progression', message: 'The authored progression arrives. The erythema has advanced well beyond the marked border, the skin is dusky, and the laboratory values have moved decisively. The score built from those values would now be firmly positive, which is the point: it became useful only after the interval in which acting on it mattered. This clock is not a validated operative deadline or a safe waiting period.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review disproportionate pain, the marked and timed border, urgent surgical review, bounded antimicrobial intent, and the boundary that no score excludes this. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): NecrotizingInfectionEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'recognize-disproportionate-pain':
        if (this.recognitionAt !== null) return events;
        this.recognitionAt = tick;
        return emit('disproportionate-pain-recognized', 'Pain that is severe, and that extends past the visible edge of the redness, in a limb not settling on treatment, is the finding that should raise this. It is a soft sign with poor specificity, and it is still the one worth acting on, because the alternative is waiting for signs that arrive late.');
      case 'mark-the-margin':
        if (this.marginAt !== null) return events;
        this.marginAt = tick;
        return emit('margin-marked', 'The border of the erythema is marked and the time written on the skin. This costs nothing, needs no equipment, and converts a static impression into a rate. A border that moves while you watch is information no single blood test in this case supplies.');
      case 'call-surgery':
        if (this.surgeryAt !== null) return events;
        this.surgeryAt = tick;
        return emit('surgery-activated', 'Urgent surgical review is requested for consideration of exploration, and the request states the concern explicitly rather than describing cellulitis that is not settling. Exploration is the only test that can exclude this, and it is a qualified-team act; nothing here selects an incision, an extent, or a theatre time.');
      case 'record-antimicrobial-intent':
        if (this.antimicrobialAt !== null) return events;
        this.antimicrobialAt = tick;
        return emit('antimicrobial-intent', 'Bounded qualified-team intent for intravenous antimicrobial therapy per local protocol is recorded alongside, not instead of, surgical review. No agent, dose, route, or combination is selected here, and antimicrobials do not treat dead tissue.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries: the widely used laboratory risk score was derived against selected severe-cellulitis controls, and in pooled validation its sensitivity at the usual cutoff is roughly two-thirds, so about one confirmed case in three scores below it. It must not be used to exclude. The score also counts late physiology, so early disease scores low by construction. Absent crepitus and absent bullae are not reassurance either, at roughly a quarter and a fifth sensitivity. Imaging is reasonably sensitive but must never delay exploration. The association between earlier surgery and survival is consistent across observational studies but confounded by indication in both directions, and there is no randomised evidence and no validated hour threshold.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous observation continues with the marked border rechecked on a stated interval. A laboratory-only result or a limb-only look is useful but does not refresh the full assessment.');
      case 'check-labs':
        this.labObservation = this.labFinding(tick);
        return emit('lab-check', `Requested fictional laboratory evidence: white cells ${this.labObservation.whiteCellsX109L.toFixed(1)} x10^9/L; C-reactive protein ${this.labObservation.crpMgL} mg/L; sodium ${this.labObservation.sodiumMmolL} mmol/L; creatinine ${this.labObservation.creatinineUmolL} µmol/L; glucose ${this.labObservation.glucoseMmolL.toFixed(1)} mmol/L; haemoglobin ${this.labObservation.haemoglobinGPerDl.toFixed(1)} g/dL; lactate ${this.labObservation.lactateMmolL.toFixed(1)} mmol/L. The derived risk score would read ${this.labObservation.riskScore}. A score below the cutoff does not exclude this diagnosis. This partial result supplies no current limb examination.`);
      case 'check-limb':
        this.limbObservation = this.limbFinding(tick);
        return emit('limb-check', `Requested limb examination: erythema ${this.limbObservation.beyondMarginCm === 0 ? 'at the marked border' : `${this.limbObservation.beyondMarginCm} cm beyond the marked border`}; skin ${this.limbObservation.dusky ? 'dusky' : 'erythematous without duskiness'}; crepitus absent; bullae absent; pain ${this.limbObservation.painBeyondErythema ? 'extends past the visible edge' : 'confined to the visible edge'}. Absent crepitus and absent bullae are late-sign absences, not reassurance. This partial examination supplies no new laboratory evidence.`);
      case 'reassess': {
        this.labObservation = this.labFinding(tick);
        this.limbObservation = this.limbFinding(tick);
        this.observation = { ...this.labObservation, ...this.limbObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.progressed) this.progressionObserved = true;
        const view = this.observation;
        return emit(this.progressed ? 'progressed-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: temperature ${view.coreTemperatureC.toFixed(1)} C; heart rate ${view.heartRateBpm}/min; BP ${view.systolicMmHg}/${view.diastolicMmHg} mmHg (MAP ${view.meanArterialMmHg}); respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}%. White cells ${view.whiteCellsX109L.toFixed(1)} x10^9/L; C-reactive protein ${view.crpMgL} mg/L; sodium ${view.sodiumMmolL} mmol/L; lactate ${view.lactateMmolL.toFixed(1)} mmol/L; derived risk score ${view.riskScore}. Erythema ${view.beyondMarginCm === 0 ? 'at the marked border' : `${view.beyondMarginCm} cm beyond the marked border`}. ${this.progressed ? 'The score is now firmly positive; it became useful only after the interval in which acting on it mattered.' : 'The score sits below its cutoff and excludes nothing.'} No diagnosis, organism, operative finding, or outcome is established.`);
      }
      case 'score-excludes':
        this.scoreExclusionAttempted = true;
        return emit('score-exclusion-refused', 'Excluding the diagnosis on a score below the cutoff was refused. Pooled validation puts its sensitivity near two-thirds, so roughly one confirmed case in three scores below that line, and the score counts late physiology that early disease has not yet produced.');
      case 'wait-for-imaging':
        this.imagingDelayAttempted = true;
        return emit('imaging-delay-refused', 'Delaying surgical review until imaging returns was refused. Imaging is reasonably sensitive and still not exclusionary, and current guidance is explicit that it must never delay exploration.');
      case 'absent-crepitus-excludes':
        this.crepitusExclusionAttempted = true;
        return emit('crepitus-exclusion-refused', 'Treating absent crepitus and absent bullae as reassurance was refused. Those signs are roughly a quarter and a fifth sensitive; they rule in when present and rule out nothing when absent, and they arrive late.');
      case 'continue-oral-antibiotics':
        this.oralContinuationAttempted = true;
        return emit('oral-continuation-refused', 'Continuing the current oral course with review tomorrow was refused. This limb has already failed to settle on that treatment, and prior antibiotics are documented to mask severity rather than resolve it.');
      case 'handoff':
        if (this.recognitionAt === null || this.marginAt === null || this.surgeryAt === null
          || this.antimicrobialAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record disproportionate pain, the marked and timed border, urgent surgical review, bounded antimicrobial intent, the boundary review, surveillance, and a current full assessment. A positive score, a confirmed diagnosis, and an imaging result are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns the surgical decision and its timing, the marked border and its rate, serial observations and laboratory evidence, delivered antimicrobial care, and the possibility that exploration finds something else entirely. The patient goes toward theatre with the diagnosis still unconfirmed, because only exploration can confirm or exclude it. Practice ends, not treatment, and no operative finding, limb outcome, or survival is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional necrotizing infection lesson. No care was started.');
    }
  }

  private labFinding(tick: number) {
    const values = this.progressed
      ? { whiteCellsX109L: 22.1, crpMgL: 214, sodiumMmolL: 131, creatinineUmolL: 176,
        glucoseMmolL: 13.1, haemoglobinGPerDl: 11.9, lactateMmolL: 4.6, riskScore: 11 }
      : { whiteCellsX109L: 14.8, crpMgL: 132, sodiumMmolL: 136, creatinineUmolL: 118,
        glucoseMmolL: 11.4, haemoglobinGPerDl: 12.6, lactateMmolL: 2.4, riskScore: 3 };
    return { atTick: tick, ...values };
  }

  private limbFinding(tick: number) {
    return { atTick: tick, beyondMarginCm: this.progressed ? 4 : 0,
      dusky: this.progressed, painBeyondErythema: true };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    const circulation = this.progressed
      ? { heartRateBpm: 126, systolicMmHg: 96, diastolicMmHg: 54, meanArterialMmHg: 68, respiratoryRateBpm: 28, spo2Percent: 93, coreTemperatureC: 38.6 }
      : { heartRateBpm: 104, systolicMmHg: 118, diastolicMmHg: 72, meanArterialMmHg: 87, respiratoryRateBpm: 22, spo2Percent: 96, coreTemperatureC: 37.4 };
    return { ...circulation,
      alertness: this.progressed ? 'distressed by pain and newly unwell' : 'alert, in severe pain, otherwise unremarkable' };
  }

  private labs() { return this.labFinding(0); }

  snapshot(tick: number): NecrotizingInfectionSnapshot {
    const remaining = (at: number) => Math.max(0, Math.ceil((at - tick) / TICKS_PER_SECOND));
    return {
      recognitionAtTick: this.recognitionAt, marginMarkedAtTick: this.marginAt,
      surgeryAtTick: this.surgeryAt, antimicrobialIntentAtTick: this.antimicrobialAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      progressionDueInSeconds: !this.ended && !this.progressed
        ? remaining(NECROTIZING_INFECTION_PROGRESSION_TICKS) : null,
      progressionObserved: this.progressionObserved,
      surgeryRequestedBeforeProgression: this.surgeryAt !== null
        && this.surgeryAt < NECROTIZING_INFECTION_PROGRESSION_TICKS,
      scoreExclusionAttempted: this.scoreExclusionAttempted,
      imagingDelayAttempted: this.imagingDelayAttempted,
      crepitusExclusionAttempted: this.crepitusExclusionAttempted,
      oralContinuationAttempted: this.oralContinuationAttempted,
      labObservation: this.labObservation ? { ...this.labObservation } : null,
      limbObservation: this.limbObservation ? { ...this.limbObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
