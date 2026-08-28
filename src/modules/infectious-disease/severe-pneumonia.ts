import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { SeverePneumoniaSnapshot } from '@platform/kernel/protocol';
export type { SeverePneumoniaSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not validated escalation deadlines or safe waits.
export const SEVERE_PNEUMONIA_DETERIORATION_TICKS = 120 * 60 * TICKS_PER_SECOND;
// Takeover sits after the deterioration so a learner who does nothing still sees it.
export const SEVERE_PNEUMONIA_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const SEVERE_PNEUMONIA_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const SEVERE_PNEUMONIA_ACTIONS = ['reconcile-supplied-scores', 'recognize-instrument-mismatch',
  'call-critical-care', 'record-escalation-intent', 'review-boundaries', 'monitor',
  'check-labs', 'check-respiratory', 'reassess', 'handoff',
  'mortality-score-decides-the-bed', 'wait-for-deterioration', 'marker-grades-severity',
  'saturation-alone-is-adequate'] as const;
export type SeverePneumoniaAction = typeof SEVERE_PNEUMONIA_ACTIONS[number];
export interface SeverePneumoniaEvent { readonly id: string; readonly message: string }

export function supportsSeverePneumonia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'severe-pneumonia-the-score-answered-another-question'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'severe-pneumonia').length === 1
    && scenario.timeline.filter((event) => event.target === 'severe-pneumonia-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'severe-pneumonia-boundary').length === 1;
}

/**
 * Nothing is hidden here and every number is correct. The failure is interpretive: a mortality
 * score is being asked a level-of-care question it was never validated to answer, while a second
 * instrument that was validated for exactly that question says something different.
 */
export class SeverePneumonia {
  private reconciliationAt: number | null = null;
  private mismatchAt: number | null = null;
  private criticalCareAt: number | null = null;
  private escalationAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private deteriorated = false;
  private deteriorationObserved = false;
  private mortalityScoreAttempted = false;
  private waitAttempted = false;
  private markerSeverityAttempted = false;
  private saturationAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private labObservation: SeverePneumoniaSnapshot['labObservation'] = null;
  private respiratoryObservation: SeverePneumoniaSnapshot['respiratoryObservation'] = null;
  private observation: SeverePneumoniaSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: SeverePneumoniaSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.vitals(), this.labs()]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): SeverePneumoniaEvent[] {
    if (this.ended) return [];
    const terminal = this.criticalCareAt === null
      ? SEVERE_PNEUMONIA_TAKEOVER_TICKS : SEVERE_PNEUMONIA_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: SeverePneumoniaEvent[] = [];
    if (!this.deteriorated && until >= SEVERE_PNEUMONIA_DETERIORATION_TICKS) {
      this.change(() => { this.deteriorated = true; });
      events.push({ id: 'clinical-deterioration', message: 'The authored deterioration arrives. Oxygenation has worsened despite more inspired oxygen, the patient is newly confused, and the pressure has fallen after a litre of crystalloid. The mortality score has now caught up and reads 4, which is the point: it was always going to, and it was never the instrument for the question of where this patient should be. This clock is not a validated escalation deadline or a safe waiting period.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the two supplied instruments and what each answers, critical-care review, bounded escalation intent, and continuing surveillance. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): SeverePneumoniaEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'reconcile-supplied-scores':
        if (this.reconciliationAt !== null) return events;
        this.reconciliationAt = tick;
        return emit('scores-reconciled', 'Both supplied instruments are correct and they disagree. The mortality score reads 2, which places this patient in a ward band. The severity criteria count 3, from a respiratory rate at or above 30, an oxygenation ratio at or below 250, and multilobar shadowing, which defines severe pneumonia. Nothing here is hidden or mismeasured; the disagreement is real and has to be resolved by asking what each instrument answers.');
      case 'recognize-instrument-mismatch':
        if (this.mismatchAt !== null) return events;
        this.mismatchAt = tick;
        return emit('instrument-mismatch-recognized', 'The mortality score is a prognostic instrument, validated to stratify thirty-day death and to support the decision to admit. It was never validated to decide level of care, and pooled discrimination for predicting critical-care admission is only about 0.69. It also weights age and comorbidity heavily, so a patient in early respiratory failure can score low. The severity criteria are the instrument built for the level-of-care question, and they are the one to act on here.');
      case 'call-critical-care':
        if (this.criticalCareAt !== null) return events;
        this.criticalCareAt = tick;
        return emit('critical-care-requested', 'Critical-care review is requested now, while the patient is still on a ward trajectory and still talking to you. The request states the severity criteria met rather than the mortality band. This is a review, not an admission decision; the receiving team owns whether and where to escalate.');
      case 'record-escalation-intent':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-intent', 'Bounded qualified-team intent is recorded for anticipated escalation of respiratory and circulatory support, to be reviewed by critical care. Nothing here selects an oxygen device, a ventilation mode, a pressure, a fluid volume, a vasoactive agent, an antimicrobial, or a steroid, and the recorded intent is not an accepted bed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries: the mortality score is not wrong, it is answering thirty-day mortality, and one national guideline uses it to support place-of-care decisions only alongside clinical judgement rather than in isolation. The severity criteria have themselves never been formally re-derived and their items carry unequal weight. No severity tool has ever been shown in a randomised trial to improve outcomes when used for critical-care triage; the evidence that delayed escalation harms is observational and confounded by indication. The C-reactive protein and the sodium here appear in no criteria set at all, however abnormal they look. And the two guideline bodies that publish on this condition are, as of 2025, publicly split, so there is no single voice to appeal to.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous observation continues with attention to the oxygen requirement rather than the saturation alone, and to conscious level. A laboratory-only result or a respiratory-only look is useful but does not refresh the full assessment.');
      case 'check-labs':
        this.labObservation = this.labFinding(tick);
        return emit('lab-check', `Requested fictional laboratory evidence: urea ${this.labObservation.ureaMmolL.toFixed(1)} mmol/L; white cells ${this.labObservation.whiteCellsX109L.toFixed(1)} x10^9/L; platelets ${this.labObservation.plateletsX109L} x10^9/L; C-reactive protein ${this.labObservation.crpMgL} mg/L; sodium ${this.labObservation.sodiumMmolL} mmol/L; lactate ${this.labObservation.lactateMmolL.toFixed(1)} mmol/L. The C-reactive protein and the sodium appear in no criteria set. This partial result supplies no current respiratory assessment.`);
      case 'check-respiratory':
        this.respiratoryObservation = this.respiratoryFinding(tick);
        return emit('respiratory-check', `Requested respiratory assessment: respiratory rate ${this.respiratoryObservation.respiratoryRateBpm}/min; oxygen saturation ${this.respiratoryObservation.spo2Percent}% on an inspired fraction of ${this.respiratoryObservation.fio2.toFixed(2)}; oxygenation ratio ${this.respiratoryObservation.pfRatio}; ${this.respiratoryObservation.confused ? 'newly confused' : 'orientated'}. A saturation without its inspired fraction says very little. This partial assessment supplies no new laboratory evidence.`);
      case 'reassess': {
        this.labObservation = this.labFinding(tick);
        this.respiratoryObservation = this.respiratoryFinding(tick);
        this.observation = { ...this.labObservation, ...this.respiratoryObservation, ...this.vitals(), ...this.scores() };
        this.observedPhase = this.phase;
        if (this.deteriorated) this.deteriorationObserved = true;
        const view = this.observation;
        return emit(this.deteriorated ? 'deteriorated-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; BP ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on an inspired fraction of ${view.fio2.toFixed(2)}; oxygenation ratio ${view.pfRatio}; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.confused ? 'newly confused' : 'orientated'}. Urea ${view.ureaMmolL.toFixed(1)} mmol/L; lactate ${view.lactateMmolL.toFixed(1)} mmol/L. Supplied mortality score ${view.mortalityScore}; severity criteria met ${view.severityCriteria}. ${this.deteriorated ? 'The mortality score has caught up, which it was always going to do.' : 'The two instruments still disagree, and only one of them answers the question in front of you.'} No diagnosis of level of care, bed availability, eligibility, disposition, prognosis, or outcome is established.`);
      }
      case 'mortality-score-decides-the-bed':
        this.mortalityScoreAttempted = true;
        return emit('mortality-score-refused', 'Using the mortality score to settle the ward decision was refused. That instrument is validated for thirty-day mortality and to support admission, not to decide level of care, and its pooled discrimination for predicting critical-care admission is only about 0.69.');
      case 'wait-for-deterioration':
        this.waitAttempted = true;
        return emit('wait-refused', 'Planning to request review once the patient deteriorates was refused. The severity criteria are already met, the request is a review rather than an admission, and the observational evidence associates delayed escalation with worse outcomes even though it cannot establish a threshold.');
      case 'marker-grades-severity':
        this.markerSeverityAttempted = true;
        return emit('marker-severity-refused', 'Grading severity by the C-reactive protein was refused. That value appears in no criteria set here, however abnormal it looks, and the same is true of the sodium.');
      case 'saturation-alone-is-adequate':
        this.saturationAttempted = true;
        return emit('saturation-refused', 'Reading the saturation as adequate without its inspired fraction was refused. Ninety-two percent on room air and ninety-two percent on a third inspired oxygen describe very different lungs, and it is the ratio that enters the severity criteria.');
      case 'handoff':
        if (this.reconciliationAt === null || this.mismatchAt === null || this.criticalCareAt === null
          || this.escalationAt === null || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the reconciliation of the two supplied instruments, the recognition that one of them answers a different question, critical-care review, bounded escalation intent, the boundary review, surveillance, and a current full assessment. A mortality band, a bed decision, and a repeated marker are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns the level-of-care decision, the oxygen and ventilatory strategy, circulatory support, antimicrobial and steroid decisions, and serial reassessment. Whether a critical-care bed exists is a real-world constraint this rehearsal does not model. Practice ends, not treatment, and neither escalation, bed availability, nor survival is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional severe pneumonia lesson. No care was started.');
    }
  }

  private labFinding(tick: number) {
    const values = this.deteriorated
      ? { ureaMmolL: 10.6, whiteCellsX109L: 18.9, plateletsX109L: 118, crpMgL: 284, sodiumMmolL: 128, lactateMmolL: 4.1 }
      : { ureaMmolL: 8.4, whiteCellsX109L: 16.4, plateletsX109L: 148, crpMgL: 284, sodiumMmolL: 129, lactateMmolL: 2.6 };
    return { atTick: tick, ...values };
  }

  private respiratoryFinding(tick: number) {
    const values = this.deteriorated
      ? { respiratoryRateBpm: 34, spo2Percent: 90, fio2: 0.6, pfRatio: 92, confused: true }
      : { respiratoryRateBpm: 30, spo2Percent: 92, fio2: 0.35, pfRatio: 171, confused: false };
    return { atTick: tick, ...values };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    const circulation = this.deteriorated
      ? { heartRateBpm: 128, systolicMmHg: 84, diastolicMmHg: 46, meanArterialMmHg: 59, coreTemperatureC: 38.4 }
      : { heartRateBpm: 116, systolicMmHg: 106, diastolicMmHg: 64, meanArterialMmHg: 78, coreTemperatureC: 38.7 };
    const breathing = this.respiratoryFinding(0);
    return { ...circulation, respiratoryRateBpm: breathing.respiratoryRateBpm, spo2Percent: breathing.spo2Percent,
      alertness: this.deteriorated ? 'newly confused and using accessory muscles' : 'orientated, breathless in short sentences' };
  }

  private labs() { return this.labFinding(0); }

  /** Both supplied instruments, recomputed from the same authored state the learner is shown. */
  private scores() {
    return this.deteriorated
      ? { mortalityScore: 4, severityCriteria: 5 }
      : { mortalityScore: 2, severityCriteria: 3 };
  }

  snapshot(tick: number): SeverePneumoniaSnapshot {
    const remaining = (at: number) => Math.max(0, Math.ceil((at - tick) / TICKS_PER_SECOND));
    return {
      reconciliationAtTick: this.reconciliationAt, mismatchAtTick: this.mismatchAt,
      criticalCareAtTick: this.criticalCareAt, escalationIntentAtTick: this.escalationAt,
      boundariesReviewedAtTick: this.boundariesAt, monitoringAtTick: this.monitoringAt,
      deteriorationDueInSeconds: !this.ended && !this.deteriorated
        ? remaining(SEVERE_PNEUMONIA_DETERIORATION_TICKS) : null,
      deteriorationObserved: this.deteriorationObserved,
      criticalCareBeforeDeterioration: this.criticalCareAt !== null
        && this.criticalCareAt < SEVERE_PNEUMONIA_DETERIORATION_TICKS,
      mortalityScoreAttempted: this.mortalityScoreAttempted,
      waitAttempted: this.waitAttempted,
      markerSeverityAttempted: this.markerSeverityAttempted,
      saturationAttempted: this.saturationAttempted,
      labObservation: this.labObservation ? { ...this.labObservation } : null,
      respiratoryObservation: this.respiratoryObservation ? { ...this.respiratoryObservation } : null,
      observation: this.observation ? { ...this.observation } : null,
      alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
