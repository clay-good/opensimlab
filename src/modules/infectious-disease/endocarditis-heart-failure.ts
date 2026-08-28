import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { EndocarditisHeartFailureSnapshot } from '@platform/kernel/protocol';
export type { EndocarditisHeartFailureSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not validated operative deadlines or safe waits.
export const ENDOCARDITIS_DECOMPENSATION_TICKS = 45 * 60 * TICKS_PER_SECOND;
// Takeover sits after the decompensation so a learner who does nothing still sees it.
export const ENDOCARDITIS_TAKEOVER_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const ENDOCARDITIS_SESSION_TICKS = 6 * 60 * 60 * TICKS_PER_SECOND;
export const ENDOCARDITIS_ACTIONS = ['recognize-mechanical-failure', 'call-endocarditis-team',
  'record-surgical-referral-intent', 'review-boundaries', 'monitor',
  'check-labs', 'check-perfusion', 'reassess', 'handoff',
  'markers-improving-means-better', 'wide-pulse-pressure-expected', 'vegetation-size-alone-decides',
  'continue-antimicrobials-and-review-tomorrow'] as const;
export type EndocarditisHeartFailureAction = typeof ENDOCARDITIS_ACTIONS[number];
export interface EndocarditisHeartFailureEvent { readonly id: string; readonly message: string }

export function supportsEndocarditisHeartFailure(scenario: Scenario): boolean {
  return scenario.metadata.id === 'endocarditis-mechanical-failure-on-a-surgical-clock'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'endocarditis-heart-failure').length === 1
    && scenario.timeline.filter((event) => event.target === 'endocarditis-heart-failure-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'endocarditis-heart-failure-boundary').length === 1;
}

/**
 * The antimicrobial course is working and the patient is dying. Cultures clear and inflammatory
 * markers fall while the valve is destroyed, so improving infection numbers are the trap. The
 * clock here is surgical, not antimicrobial, and nothing medical closes the gap.
 */
export class EndocarditisHeartFailure {
  private recognitionAt: number | null = null;
  private teamAt: number | null = null;
  private referralAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private decompensated = false;
  private decompensationObserved = false;
  private markerReassuranceAttempted = false;
  private pulsePressureErrorAttempted = false;
  private vegetationOnlyAttempted = false;
  private deferralAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private labObservation: EndocarditisHeartFailureSnapshot['labObservation'] = null;
  private perfusionObservation: EndocarditisHeartFailureSnapshot['perfusionObservation'] = null;
  private observation: EndocarditisHeartFailureSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: EndocarditisHeartFailureSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.vitals(), this.labs()]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): EndocarditisHeartFailureEvent[] {
    if (this.ended) return [];
    const terminal = this.teamAt === null && this.referralAt === null
      ? ENDOCARDITIS_TAKEOVER_TICKS : ENDOCARDITIS_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: EndocarditisHeartFailureEvent[] = [];
    if (!this.decompensated && until >= ENDOCARDITIS_DECOMPENSATION_TICKS) {
      this.change(() => { this.decompensated = true; });
      events.push({ id: 'acute-decompensation', message: 'The authored decompensation arrives. The leaflet defect has extended and the regurgitation is now acute and severe. Note what has not happened: the pulse pressure has narrowed rather than widened, because the classic wide-pulse-pressure picture belongs to chronic regurgitation, not to a ventricle that has had no time to dilate. The antimicrobial course continues unchanged and the inflammatory markers keep falling. Nothing medical closes this gap. This clock is not a validated operative deadline or a safe waiting period.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recognition of mechanical failure, activation of the endocarditis team, bounded surgical-referral intent, and the boundary that falling markers are not an improving patient. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): EndocarditisHeartFailureEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'recognize-mechanical-failure':
        if (this.recognitionAt !== null) return events;
        this.recognitionAt = tick;
        return emit('mechanical-failure-recognized', 'Breathlessness on day three of appropriate antimicrobial therapy, with a supplied new severe regurgitation and a 12 mm vegetation, describes mechanical failure of the valve rather than failure of the antimicrobial course. The infection may well be responding while the valve is being destroyed; those are separate problems on separate clocks.');
      case 'call-endocarditis-team':
        if (this.teamAt !== null) return events;
        this.teamAt = tick;
        return emit('endocarditis-team-activated', 'The multidisciplinary endocarditis team is convened and the case is discussed with a centre that performs valve surgery. This is the named structure the guidance describes, and the correct answer to what this patient needs is a team and a theatre rather than a different drug.');
      case 'record-surgical-referral-intent':
        if (this.referralAt !== null) return events;
        this.referralAt = tick;
        return emit('surgical-referral-intent', 'Bounded qualified-team intent for urgent surgical assessment and transfer is recorded. Nothing here selects an operation, a prosthesis, a theatre time, or an anaesthetic plan, and the recorded intent is not proof the patient has been accepted, transferred, or operated on.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries: falling inflammatory markers and clearing cultures describe the infection, not the valve, and cannot reassure about mechanical failure. Acute severe regurgitation presents with a normal or narrow pulse pressure, a soft or absent first heart sound, and a short quiet murmur that is easily missed; the collapsing pulse and wide pulse pressure of the textbook belong to chronic disease. Vegetation size is not a standalone surgical trigger; the size threshold operates together with an embolic episode or another indication. The surgical timing tiers are consensus operationalizations of urgency rather than thresholds validated by randomised trial, and the one major trial in this area enrolled a narrow stable population that does not generalise to a decompensating patient.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous observation continues with attention to work of breathing and perfusion rather than to the temperature chart. A laboratory-only result or a perfusion-only look is useful but does not refresh the full assessment.');
      case 'check-labs':
        this.labObservation = this.labFinding(tick);
        return emit('lab-check', `Requested fictional laboratory evidence: white cells ${this.labObservation.whiteCellsX109L.toFixed(1)} x10^9/L; C-reactive protein ${this.labObservation.crpMgL} mg/L; creatinine ${this.labObservation.creatinineUmolL} µmol/L; lactate ${this.labObservation.lactateMmolL.toFixed(1)} mmol/L; blood cultures ${this.labObservation.culturesClearing ? 'no growth on the latest set' : 'growth on the admission set'}. Falling markers and clearing cultures describe the infection, not the valve. This partial result supplies no current perfusion assessment.`);
      case 'check-perfusion':
        this.perfusionObservation = this.perfusionFinding(tick);
        return emit('perfusion-check', `Requested examination: BP ${this.perfusionObservation.systolicMmHg}/${this.perfusionObservation.diastolicMmHg} mmHg, pulse pressure ${this.perfusionObservation.pulsePressureMmHg} mmHg; respiratory rate ${this.perfusionObservation.respiratoryRateBpm}/min; oxygen saturation ${this.perfusionObservation.spo2Percent}% on ${this.perfusionObservation.oxygenSupport}; ${this.perfusionObservation.cracklesToApices ? 'crackles to the apices' : 'bibasal crackles'}. A narrow pulse pressure here is the expected finding in acute severe regurgitation, not evidence against it. This partial examination supplies no new laboratory evidence.`);
      case 'reassess': {
        this.labObservation = this.labFinding(tick);
        this.perfusionObservation = this.perfusionFinding(tick);
        this.observation = { ...this.labObservation, ...this.perfusionObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.decompensated) this.decompensationObserved = true;
        const view = this.observation;
        return emit(this.decompensated ? 'decompensated-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; BP ${view.systolicMmHg}/${view.diastolicMmHg} mmHg, pulse pressure ${view.pulsePressureMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on ${view.oxygenSupport}; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.alertness}. C-reactive protein ${view.crpMgL} mg/L; lactate ${view.lactateMmolL.toFixed(1)} mmol/L; cultures ${view.culturesClearing ? 'no growth on the latest set' : 'growth on the admission set'}. ${this.decompensated ? 'The markers have fallen further while the patient has become very much worse; that divergence is the whole point.' : 'Recorded intent is not an accepted transfer or a completed operation.'} No diagnosis of the operative findings, eligibility, disposition, prognosis, or outcome is established.`);
      }
      case 'markers-improving-means-better':
        this.markerReassuranceAttempted = true;
        return emit('marker-reassurance-refused', 'Reading the falling C-reactive protein and clearing cultures as an improving patient was refused. Those numbers describe the infection, which is responding. The valve is being destroyed at the same time, and no inflammatory marker measures that.');
      case 'wide-pulse-pressure-expected':
        this.pulsePressureErrorAttempted = true;
        return emit('pulse-pressure-error-refused', 'Excluding severe regurgitation because the pulse pressure is not wide was refused. Acute severe regurgitation gives a normal or narrow pulse pressure, because the ventricle has had no time to dilate; the collapsing pulse and wide pulse pressure of the textbook belong to chronic disease.');
      case 'vegetation-size-alone-decides':
        this.vegetationOnlyAttempted = true;
        return emit('vegetation-only-refused', 'Treating the vegetation size as a standalone surgical trigger was refused. The size threshold operates together with an embolic episode or another indication, and this patient already has the stronger indication in front of you: heart failure from valve destruction.');
      case 'continue-antimicrobials-and-review-tomorrow':
        this.deferralAttempted = true;
        return emit('deferral-refused', 'Continuing the antimicrobial course and reviewing tomorrow was refused. The antimicrobial course is already appropriate and already working; the problem is mechanical, and it is on a surgical clock that a further day does not respect.');
      case 'handoff':
        if (this.recognitionAt === null || this.teamAt === null || this.referralAt === null
          || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the recognition of mechanical failure, activation of the endocarditis team, bounded surgical-referral intent, the boundary review, surveillance, and a current full assessment. A falling marker, a negative culture, and a measured vegetation are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns the surgical decision and its timing, the transfer, continuing antimicrobial therapy and its duration, serial perfusion and respiratory assessment, and the possibility of embolic and neurologic complications. The patient goes toward a surgical decision that is not this rehearsal to make. Practice ends, not treatment, and neither operability, transfer acceptance, nor survival is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional endocarditis lesson. No care was started.');
    }
  }

  private labFinding(tick: number) {
    const values = this.decompensated
      ? { whiteCellsX109L: 14.2, crpMgL: 128, creatinineUmolL: 148, lactateMmolL: 4.3, culturesClearing: true }
      : { whiteCellsX109L: 16.8, crpMgL: 180, creatinineUmolL: 124, lactateMmolL: 2.1, culturesClearing: true };
    return { atTick: tick, ...values };
  }

  private perfusionFinding(tick: number) {
    const { systolicMmHg, diastolicMmHg, respiratoryRateBpm, spo2Percent } = this.vitals();
    return { atTick: tick, systolicMmHg, diastolicMmHg, respiratoryRateBpm, spo2Percent,
      pulsePressureMmHg: systolicMmHg - diastolicMmHg,
      oxygenSupport: this.decompensated ? '15 L via a non-rebreather mask' : 'room air',
      cracklesToApices: this.decompensated };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    const circulation = this.decompensated
      // Acute severe regurgitation narrows the pulse pressure; it does not widen it.
      ? { heartRateBpm: 132, systolicMmHg: 96, diastolicMmHg: 78, meanArterialMmHg: 84, respiratoryRateBpm: 36, spo2Percent: 84, coreTemperatureC: 38.1 }
      : { heartRateBpm: 118, systolicMmHg: 104, diastolicMmHg: 62, meanArterialMmHg: 76, respiratoryRateBpm: 26, spo2Percent: 92, coreTemperatureC: 38.4 };
    return { ...circulation,
      alertness: this.decompensated ? 'exhausted, sitting forward, speaking in single words' : 'alert, breathless on minimal exertion' };
  }

  private labs() { return this.labFinding(0); }

  snapshot(tick: number): EndocarditisHeartFailureSnapshot {
    const remaining = (at: number) => Math.max(0, Math.ceil((at - tick) / TICKS_PER_SECOND));
    return {
      recognitionAtTick: this.recognitionAt, teamAtTick: this.teamAt,
      surgicalReferralAtTick: this.referralAt, boundariesReviewedAtTick: this.boundariesAt,
      monitoringAtTick: this.monitoringAt,
      decompensationDueInSeconds: !this.ended && !this.decompensated
        ? remaining(ENDOCARDITIS_DECOMPENSATION_TICKS) : null,
      decompensationObserved: this.decompensationObserved,
      referralBeforeDecompensation: this.referralAt !== null
        && this.referralAt < ENDOCARDITIS_DECOMPENSATION_TICKS,
      markerReassuranceAttempted: this.markerReassuranceAttempted,
      pulsePressureErrorAttempted: this.pulsePressureErrorAttempted,
      vegetationOnlyAttempted: this.vegetationOnlyAttempted,
      deferralAttempted: this.deferralAttempted,
      pulsePressureMmHg: this.vitals().systolicMmHg - this.vitals().diastolicMmHg,
      labObservation: this.labObservation ? { ...this.labObservation } : null,
      perfusionObservation: this.perfusionObservation ? { ...this.perfusionObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
