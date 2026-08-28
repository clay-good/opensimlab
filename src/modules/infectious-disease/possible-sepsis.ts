import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { PossibleSepsisSnapshot } from '@platform/kernel/protocol';
export type { PossibleSepsisSnapshot } from '@platform/kernel/protocol';

/**
 * The ceiling runs from first suspicion whether or not anyone looks at it. Investigation here is
 * time-limited, never open-ended, so this lesson exposes no waiting action: the learner requests a
 * bounded assessment against a visible clock. Any drift toward shock collapses the branch to the
 * immediate path with no learner discretion.
 */
export const POSSIBLE_SEPSIS_INVESTIGATION_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const POSSIBLE_SEPSIS_CEILING_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const POSSIBLE_SEPSIS_SHOCK_TICKS = 195 * 60 * TICKS_PER_SECOND;
export const POSSIBLE_SEPSIS_TAKEOVER_TICKS = 225 * 60 * TICKS_PER_SECOND;
export const POSSIBLE_SEPSIS_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const POSSIBLE_SEPSIS_ACTIONS = ['record-time-zero', 'record-uncertainty',
  'request-time-limited-assessment', 'record-antimicrobial-intent', 'review-boundaries', 'monitor',
  'check-labs', 'check-perfusion', 'reassess', 'handoff',
  'wait-and-see', 'assign-the-tier', 'single-test-rules-out', 'defer-without-a-ceiling'] as const;
export type PossibleSepsisAction = typeof POSSIBLE_SEPSIS_ACTIONS[number];
export interface PossibleSepsisEvent { readonly id: string; readonly message: string }

export function supportsPossibleSepsis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'possible-sepsis-a-clock-that-runs-either-way'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'possible-sepsis').length === 1
    && scenario.timeline.filter((event) => event.target === 'possible-sepsis-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'possible-sepsis-boundary').length === 1;
}

export class PossibleSepsis {
  private timeZeroAt: number | null = null;
  private uncertaintyAt: number | null = null;
  private assessmentAt: number | null = null;
  private antimicrobialAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private investigated = false;
  private shocked = false;
  private ceilingPassed = false;
  private investigationObserved = false;
  private waitAttempted = false;
  private tierAttempted = false;
  private singleTestAttempted = false;
  private deferralAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private labObservation: PossibleSepsisSnapshot['labObservation'] = null;
  private perfusionObservation: PossibleSepsisSnapshot['perfusionObservation'] = null;
  private observation: PossibleSepsisSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: PossibleSepsisSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.vitals(), this.labs()]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): PossibleSepsisEvent[] {
    if (this.ended) return [];
    const terminal = this.antimicrobialAt === null && this.assessmentAt === null
      ? POSSIBLE_SEPSIS_TAKEOVER_TICKS : POSSIBLE_SEPSIS_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: PossibleSepsisEvent[] = [];
    if (!this.investigated && until >= POSSIBLE_SEPSIS_INVESTIGATION_TICKS) {
      this.change(() => { this.investigated = true; });
      events.push({ id: 'investigation-returns', message: 'The time-limited assessment returns and concern for infection persists: imaging reports an infected, obstructed-free upper urinary tract and the lactate has risen. The likelihood is now higher than possible, which the qualified team classifies rather than the learner. The ceiling has not moved, because it runs from first suspicion rather than from this result.' });
    }
    if (!this.ceilingPassed && this.antimicrobialAt === null && until >= POSSIBLE_SEPSIS_CEILING_TICKS) {
      this.ceilingPassed = true;
      events.push({ id: 'ceiling-passed', message: 'Three hours have elapsed since first suspicion with no antimicrobial intent recorded. The ceiling has passed. It ran from the moment infection was first suspected, whether or not anyone was watching it, which is why it is recorded and displayed rather than remembered.' });
    }
    if (!this.shocked && this.antimicrobialAt === null && until >= POSSIBLE_SEPSIS_SHOCK_TICKS) {
      this.change(() => { this.shocked = true; });
      events.push({ id: 'shock-gate', message: 'The pressure has fallen and the lactate has risen further. This is no longer a possible-sepsis question, and the three-hour ceiling has already passed. The branch collapses to the immediate path: antimicrobial therapy is now indicated within the hour, and no time-limited investigation remains available. That change is not the learner’s to weigh. One authored deterioration is not evidence that delay causes shock, and no counterfactual is offered here.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded time of first suspicion, the recorded uncertainty, the time-limited assessment, and bounded antimicrobial intent inside the ceiling. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): PossibleSepsisEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-time-zero':
        if (this.timeZeroAt !== null) return events;
        this.timeZeroAt = tick;
        return emit('time-zero-recorded', 'The time infection was first suspected is recorded and the ceiling is now displayed. Three hours run from this moment whether or not anyone looks at the clock. Recording it is what makes any later delay visible rather than invisible.');
      case 'record-uncertainty':
        if (this.uncertaintyAt !== null) return events;
        this.uncertaintyAt = tick;
        return emit('uncertainty-recorded', 'The record states what is actually known: infection cannot be excluded, there is no shock, and senior assessment is requested. It does not assign a likelihood tier, because that classification belongs to the qualified team and this lesson does not expose the operational definitions it would need.');
      case 'request-time-limited-assessment':
        if (this.assessmentAt !== null) return events;
        this.assessmentAt = tick;
        return emit('assessment-requested', 'A time-limited course of rapid investigation is requested, with the ceiling already running. Time-limited is the whole of it: this is not an interval of observation, and the clock does not pause while results are awaited.');
      case 'record-antimicrobial-intent':
        if (this.antimicrobialAt !== null) return events;
        this.change(() => { this.antimicrobialAt = tick; });
        return emit('antimicrobial-intent', `Bounded qualified-team antimicrobial intent is recorded ${this.ceilingPassed ? `after the ceiling has passed, which is recorded rather than hidden${this.shocked ? ', on the immediate path the branch has since collapsed to' : ''}` : 'inside the ceiling'}. No agent, dose, route, or combination is selected here, and de-escalation once cultures return is a qualified-team decision.`);
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries: current guidance is tiered rather than uniform. Septic shock, and probable or definite sepsis without shock, carry a strong recommendation for antimicrobials immediately and ideally within one hour. Possible sepsis without shock carries a conditional suggestion for a time-limited course of rapid investigation and, if concern persists, antimicrobials within three hours of first suspicion. Every one of those statements rests on very low certainty of evidence, including the strong ones, so conditional does not mean optional. Sepsis is a clinical diagnosis and should not be ruled in or out on a single biomarker or test. Note the system tension honestly: the national quality measure is still built around the one-hour clock and moved into value-based purchasing, so a three-hour path can be guideline-endorsed and still be measured against a faster clock.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Close continuous observation continues while the assessment runs, because the deferral tier is explicitly conditional on it. A laboratory-only result or a perfusion-only look is useful but does not refresh the full assessment.');
      case 'check-labs':
        this.labObservation = this.labFinding(tick);
        return emit('lab-check', `Requested fictional laboratory evidence: lactate ${this.labObservation.lactateMmolL.toFixed(1)} mmol/L; white cells ${this.labObservation.whiteCellsX109L.toFixed(1)} x10^9/L; C-reactive protein ${this.labObservation.crpMgL} mg/L; creatinine ${this.labObservation.creatinineUmolL} µmol/L; source ${this.labObservation.sourceIdentified ? 'identified on the returned assessment' : 'not identified'}. No single value here rules infection in or out. This partial result supplies no current perfusion assessment.`);
      case 'check-perfusion':
        this.perfusionObservation = this.perfusionFinding(tick);
        return emit('perfusion-check', `Requested examination: BP ${this.perfusionObservation.systolicMmHg}/${this.perfusionObservation.diastolicMmHg} mmHg; heart rate ${this.perfusionObservation.heartRateBpm}/min; respiratory rate ${this.perfusionObservation.respiratoryRateBpm}/min; temperature ${this.perfusionObservation.coreTemperatureC.toFixed(1)} C; ${this.perfusionObservation.hypotensive ? 'hypotensive, so the immediate path applies' : 'not hypotensive'}. This partial examination supplies no new laboratory evidence.`);
      case 'reassess': {
        this.labObservation = this.labFinding(tick);
        this.perfusionObservation = this.perfusionFinding(tick);
        this.observation = { ...this.labObservation, ...this.perfusionObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.investigated) this.investigationObserved = true;
        const view = this.observation;
        return emit(this.shocked ? 'shocked-reassessment' : this.investigated ? 'investigated-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; BP ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.alertness}. Lactate ${view.lactateMmolL.toFixed(1)} mmol/L; C-reactive protein ${view.crpMgL} mg/L; source ${view.sourceIdentified ? 'identified' : 'not identified'}. ${this.shocked ? 'The branch has collapsed to the immediate path.' : this.investigated ? 'Concern for infection persists, and the ceiling still runs from first suspicion.' : 'Infection cannot be excluded and there is no shock.'} No likelihood tier, organism, or outcome is established here.`);
      }
      case 'wait-and-see':
        this.waitAttempted = true;
        return emit('wait-refused', 'Observing and reviewing later was refused. There is no waiting action in this lesson. What the guidance permits is a time-limited course of rapid investigation against a recorded ceiling, which is a different thing: the clock runs either way, and only recording it makes any delay visible.');
      case 'assign-the-tier':
        this.tierAttempted = true;
        return emit('tier-refused', 'Assigning the likelihood tier was refused. That classification belongs to the qualified team, the operational definitions separating possible from probable are not supplied here, and the learner’s record should state what is known rather than a category.');
      case 'single-test-rules-out':
        this.singleTestAttempted = true;
        return emit('single-test-refused', 'Ruling infection in or out on one biomarker was refused. Current guidance states plainly that sepsis is a clinical diagnosis and should not be ruled in or ruled out using a single biomarker or diagnostic test.');
      case 'defer-without-a-ceiling':
        this.deferralAttempted = true;
        return emit('deferral-refused', 'Deferring antimicrobials without recording a time limit was refused. The deferral tier in the guidance is explicitly conditional on continuing close monitoring, and an unbounded deferral is not the same decision at all.');
      case 'handoff':
        if (this.timeZeroAt === null || this.uncertaintyAt === null || this.assessmentAt === null
          || this.antimicrobialAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the time of first suspicion, the uncertainty as it stands, the time-limited assessment, bounded antimicrobial intent, the boundary review, close monitoring, and a current full assessment. A settled tier, an identified organism, and a normal biomarker are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the likelihood classification, antimicrobial selection and delivery, de-escalation once cultures return, source review, and continued close monitoring. The recorded time of first suspicion travels with the patient, and the antimicrobial intent was recorded ${this.antimicrobialAt !== null && this.antimicrobialAt < POSSIBLE_SEPSIS_CEILING_TICKS ? 'inside the ceiling' : 'after the ceiling had passed, which is handed over explicitly'}. Practice ends, not treatment, and no tier, organism, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional possible sepsis lesson. No care was started.');
    }
  }

  private labFinding(tick: number) {
    const values = this.shocked
      ? { lactateMmolL: 4.4, whiteCellsX109L: 17.8, crpMgL: 186, creatinineUmolL: 138, sourceIdentified: true }
      : this.investigated
        ? { lactateMmolL: 3.1, whiteCellsX109L: 15.2, crpMgL: 142, creatinineUmolL: 112, sourceIdentified: true }
        : { lactateMmolL: 2.4, whiteCellsX109L: 13.6, crpMgL: 96, creatinineUmolL: 96, sourceIdentified: false };
    return { atTick: tick, ...values };
  }

  private perfusionFinding(tick: number) {
    const { systolicMmHg, diastolicMmHg, heartRateBpm, respiratoryRateBpm, coreTemperatureC } = this.vitals();
    return { atTick: tick, systolicMmHg, diastolicMmHg, heartRateBpm, respiratoryRateBpm, coreTemperatureC,
      hypotensive: this.shocked };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    const circulation = this.shocked
      ? { heartRateBpm: 126, systolicMmHg: 86, diastolicMmHg: 48, meanArterialMmHg: 61, respiratoryRateBpm: 26, spo2Percent: 94, coreTemperatureC: 38.8 }
      : this.investigated
        ? { heartRateBpm: 114, systolicMmHg: 112, diastolicMmHg: 68, meanArterialMmHg: 83, respiratoryRateBpm: 24, spo2Percent: 95, coreTemperatureC: 38.6 }
        : { heartRateBpm: 108, systolicMmHg: 118, diastolicMmHg: 72, meanArterialMmHg: 87, respiratoryRateBpm: 22, spo2Percent: 95, coreTemperatureC: 38.4 };
    return { ...circulation,
      alertness: this.shocked ? 'drowsy and peripherally cool' : 'alert and orientated' };
  }

  private labs() { return this.labFinding(0); }

  snapshot(tick: number): PossibleSepsisSnapshot {
    const remaining = (at: number) => Math.max(0, Math.ceil((at - tick) / TICKS_PER_SECOND));
    return {
      timeZeroAtTick: this.timeZeroAt, uncertaintyAtTick: this.uncertaintyAt,
      assessmentAtTick: this.assessmentAt, antimicrobialIntentAtTick: this.antimicrobialAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      // The ceiling is displayed from the moment it is recorded, because a clock nobody can see is
      // a clock nobody respects. It counts down whatever the learner does.
      ceilingDueInSeconds: !this.ended && this.timeZeroAt !== null && !this.ceilingPassed
        ? remaining(POSSIBLE_SEPSIS_CEILING_TICKS) : null,
      ceilingPassed: this.ceilingPassed,
      investigationReturned: this.investigated,
      investigationObserved: this.investigationObserved,
      immediatePathApplies: this.shocked,
      antimicrobialInsideCeiling: this.antimicrobialAt !== null
        && this.antimicrobialAt < POSSIBLE_SEPSIS_CEILING_TICKS,
      waitAttempted: this.waitAttempted,
      tierAttempted: this.tierAttempted,
      singleTestAttempted: this.singleTestAttempted,
      deferralAttempted: this.deferralAttempted,
      labObservation: this.labObservation ? { ...this.labObservation } : null,
      perfusionObservation: this.perfusionObservation ? { ...this.perfusionObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
