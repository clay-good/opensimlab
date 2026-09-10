import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalEstimatedFiltrationSnapshot } from '@platform/kernel/protocol';
export type { RenalEstimatedFiltrationSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not kinetics, safe waits, or grading deadlines.
export const RENAL_ESTIMATE_SECOND_MARKER_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_ESTIMATE_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const RENAL_ESTIMATE_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_ESTIMATE_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const RENAL_ESTIMATE_ACTIONS = ['review-precision', 'review-generation', 'request-second-marker',
  'review-discordance', 'own-medicine-decision', 'call-support', 'monitor', 'check-creatinine',
  'check-second-marker', 'reassess', 'handoff', 'dose-on-estimate', 'take-the-convenient-number'] as const;
export type RenalEstimateAction = typeof RENAL_ESTIMATE_ACTIONS[number];
export interface RenalEstimateEvent { readonly id: string; readonly message: string }

export function supportsRenalEstimatedFiltration(scenario: Scenario): boolean {
  return scenario.metadata.id === 'estimated-filtration-a-number-she-was-never-measured-by'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-estimate').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-estimate-boundary').length === 1;
}

/**
 * The rehearsal never supplies a measured filtration rate, and it never resolves the disagreement.
 *
 * Every other lesson in this module eventually hands the learner something firmer than it started
 * with. This one deliberately does not: the second marker returns a different estimate, both stay
 * estimates, and `measuredFiltration` is null in every observation the engine can produce. A
 * learner waiting for the real number is meant to notice that nobody is going to give it to them.
 */
export class RenalEstimatedFiltration {
  private precisionAt: number | null = null;
  private generationAt: number | null = null;
  private secondMarkerAt: number | null = null;
  private discordanceAt: number | null = null;
  private medicineAt: number | null = null;
  private supportAt: number | null = null;
  private monitoringAt: number | null = null;
  private markerReturned = false;
  private unreviewed = false;
  private doseAttempted = false;
  private convenientAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private creatinineObservation: RenalEstimatedFiltrationSnapshot['creatinineObservation'] = null;
  private markerObservation: RenalEstimatedFiltrationSnapshot['markerObservation'] = null;
  private observation: RenalEstimatedFiltrationSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RenalEstimatedFiltrationSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.markerReturned, this.medicineAt !== null, this.unreviewed]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): RenalEstimateEvent[] {
    if (this.ended) return [];
    const terminal = this.precisionAt === null && this.secondMarkerAt === null
      ? RENAL_ESTIMATE_TAKEOVER_TICKS : RENAL_ESTIMATE_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: RenalEstimateEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.unreviewed && this.precisionAt === null && until >= RENAL_ESTIMATE_DELAY_TICKS) {
      due.push({ at: RENAL_ESTIMATE_DELAY_TICKS, apply: () => {
        this.change(() => { this.unreviewed = true; });
        events.push({ id: 'unreviewed-contrast', message: 'The reported estimate still stands unexamined in this authored contrast, and the medicine is still due at the dose it supports. Read what the number claims before anyone acts on it. The teaching clock is not a safe waiting period, a deterioration prediction, or a grading cutoff.' });
      } });
    }
    if (this.secondMarkerAt !== null && !this.markerReturned && until >= this.secondMarkerAt + RENAL_ESTIMATE_SECOND_MARKER_TICKS) {
      due.push({ at: this.secondMarkerAt + RENAL_ESTIMATE_SECOND_MARKER_TICKS, apply: () => {
        this.change(() => { this.markerReturned = true; });
        events.push({ id: 'second-marker-checkpoint', message: 'The second marker has returned and it disagrees with the first. Request the findings together. The disagreement is the result; neither value is a measurement, and no measured filtration rate is available in this rehearsal.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review what the reported estimate claims, what it was generated from, the second marker, and who owns the medicine decision. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalEstimateEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'review-precision':
        if (this.precisionAt !== null) return events;
        this.precisionAt = tick;
        return emit('precision-review', 'Recorded: in the validation work behind the current equations, 85% or more of estimated values fell within 30% of measured filtration. Read the other way, that is up to one value in seven outside even a 30% band. A reported 68 is therefore compatible with a wide span of true values, and with a meaningful chance of lying outside that span. This is a property of the estimate, not a claim about her.');
      case 'review-generation':
        if (this.generationAt !== null) return events;
        this.generationAt = tick;
        return emit('generation-review', 'Recorded: this estimate infers filtration from creatinine, whose production depends on muscle. Frailty, a weight of 44 kg, notably low muscle mass, and a below-knee amputation all lower that production without any change in the kidney, which pushes a creatinine-based estimate upward. The reported figure is also indexed to 1.73 m², a population convention rather than her body. None of this establishes that her filtration is low.');
      case 'request-second-marker':
        if (this.secondMarkerAt !== null) return events;
        this.secondMarkerAt = tick;
        return emit('second-marker-requested', 'A differently generated marker is requested with qualified support. It is not produced by muscle, so it does not share the first marker’s weakness — it has weaknesses of its own, and it is still an estimate. This lesson does not name it as the better one.');
      case 'review-discordance':
        if (this.discordanceAt !== null) return events;
        if (!this.markerReturned) return emit('discordance-early', 'The second marker has not returned yet, so there is nothing to compare. Continue the review rather than deciding now.');
        this.discordanceAt = tick;
        return emit('discordance-review', 'Recorded: the two estimates disagree by more than 30%. The disagreement is the finding. Neither is a measurement, and this rehearsal supplies no measured filtration rate to settle it. In one retrospective cohort of one drug, a discordance of this size was associated with drug exposure higher than predicted — an association in older, longer-stay patients, not a rule and not a correction factor.');
      case 'own-medicine-decision':
        if (this.medicineAt !== null) return events;
        this.change(() => { this.medicineAt = tick; });
        return emit('medicine-owned', 'The decision about the renally eliminated medicine is placed explicitly with the qualified team that has the whole picture — the estimates, their width, what they were generated from, her weight and muscle, and the reason the medicine is wanted. This lesson selects no drug, dose, adjustment, or monitoring plan, and does not decide whether it should be started.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified renal, pharmacy, and nursing teams share the interpretation, the medicine decision, and continuing review. Care does not wait for support acknowledgment.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Arrange continuing clinical and biochemical review, and record the confusion as an open question with no cause established. A repeated marker is not the same as a narrower answer.');
      case 'check-creatinine':
        this.creatinineObservation = this.creatinineFinding(tick);
        return emit('creatinine-check', `Requested fictional creatinine: ${this.creatinineObservation.creatinineUmolL} µmol/L, reported estimate ${this.creatinineObservation.creatinineEstimate} mL/min/1.73 m². Repeating this marker repeats the same inference from the same input; it narrows nothing.`);
      case 'check-second-marker':
        this.markerObservation = this.markerFinding(tick);
        return emit('second-marker-check', this.markerObservation.cystatinEstimate === null
          ? 'The second marker has not returned. Nothing is available to compare, and the first estimate has not changed in the meantime.'
          : `Requested fictional second-marker estimate: ${this.markerObservation.cystatinEstimate} mL/min/1.73 m². This partial result supplies no clinical assessment, and it is an estimate rather than a measurement.`);
      case 'reassess':
        this.creatinineObservation = this.creatinineFinding(tick);
        this.markerObservation = this.markerFinding(tick);
        this.observation = { ...this.creatinineFinding(tick), cystatinEstimate: this.markerFinding(tick).cystatinEstimate,
          measuredFiltration: null, confusionPresent: true, ...this.vitals() };
        this.observedPhase = this.phase;
        return emit(this.markerReturned ? 'discordant-reassessment' : this.unreviewed ? 'unreviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: creatinine ${this.observation.creatinineUmolL} µmol/L with a reported estimate of ${this.observation.creatinineEstimate} mL/min/1.73 m²; second-marker estimate ${this.observation.cystatinEstimate === null ? 'not returned' : `${this.observation.cystatinEstimate} mL/min/1.73 m²`}; measured filtration not available. She remains slower than her baseline and mildly confused, with no cause established. HR ${this.observation.heartRateBpm}/min, BP ${this.observation.systolicMmHg}/${this.observation.diastolicMmHg} mmHg. Every filtration figure here is an estimate, and no measurement is coming.`);
      case 'dose-on-estimate':
        this.doseAttempted = true;
        return emit('dose-refused', 'Starting at the dose the reported estimate supports, on the strength of that estimate alone, was refused. The value is one estimate with a wide band around it, generated from a marker her muscle mass makes unreliable. This refusal does not say the medicine is wrong for her, does not select any other dose, and does not decide whether it should be started at all.');
      case 'take-the-convenient-number':
        this.convenientAttempted = true;
        return emit('convenient-number-refused', 'Resolving the disagreement by adopting whichever estimate suits the plan was refused. Both are estimates, neither has been checked against a measurement here, and choosing between them by convenience converts an open question into a false answer. The disagreement is what gets handed on.');
      case 'handoff':
        if (this.precisionAt === null || this.generationAt === null || this.secondMarkerAt === null
          || this.discordanceAt === null || this.medicineAt === null || this.supportAt === null
          || this.monitoringAt === null || this.observation === null
          || this.observedPhase !== this.phase || !this.markerReturned) {
          return emit('handoff-refused', 'Record what the reported estimate claims, what it was generated from, the second marker and the disagreement it produced, the owned medicine decision, support, monitoring, and a current full assessment. A single agreed number, a resolved discordance, and a measured filtration rate are not handoff gates, and none of them exists here.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns the medicine decision and the open question. Two estimates disagree, neither is a measurement, no measured filtration rate has been performed, and her confusion has no cause established. What is handed on is the uncertainty, stated as uncertainty. Practice ends, not care, and no filtration rate, cause, dose, or discharge readiness is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional estimated-filtration lesson. No care was started.');
    }
  }

  private creatinineFinding(tick: number) {
    return { atTick: tick, creatinineUmolL: 71, creatinineEstimate: 68 };
  }
  private markerFinding(tick: number) {
    return { atTick: tick, cystatinEstimate: this.markerReturned ? 38 : null };
  }
  rhythm(): 'sinus' { return 'sinus'; }
  vitals() {
    return { heartRateBpm: 78, systolicMmHg: 126, diastolicMmHg: 68, meanArterialMmHg: 87,
      respiratoryRateBpm: 16, spo2Percent: 97, coreTemperatureC: 36.5,
      alertness: 'awake, slower than her baseline, and mildly confused' };
  }
  snapshot(tick: number): RenalEstimatedFiltrationSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return { supportActive: this.supportAt !== null, precisionReviewedAtTick: this.precisionAt,
      generationReviewedAtTick: this.generationAt, secondMarkerRequestedAtTick: this.secondMarkerAt,
      discordanceReviewedAtTick: this.discordanceAt, medicineOwnedAtTick: this.medicineAt,
      monitoringAtTick: this.monitoringAt,
      secondMarkerDueInSeconds: !this.ended && this.secondMarkerAt !== null && !this.markerReturned
        ? remaining(this.secondMarkerAt, RENAL_ESTIMATE_SECOND_MARKER_TICKS) : null,
      secondMarkerReturned: this.markerReturned, unreviewedContrastObserved: this.unreviewed,
      doseOnEstimateAttempted: this.doseAttempted, convenientNumberAttempted: this.convenientAttempted,
      creatinineObservation: this.creatinineObservation ? { ...this.creatinineObservation } : null,
      markerObservation: this.markerObservation ? { ...this.markerObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
