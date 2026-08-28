import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { MeningococcalSepsisSnapshot } from '@platform/kernel/protocol';
export type { MeningococcalSepsisSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not incubation kinetics, safe waits, or grading deadlines.
export const MENINGOCOCCAL_SEPSIS_DELAY_TICKS = 10 * 60 * TICKS_PER_SECOND;
export const MENINGOCOCCAL_SEPSIS_RESPONSE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const MENINGOCOCCAL_SEPSIS_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const MENINGOCOCCAL_SEPSIS_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const MENINGOCOCCAL_SEPSIS_ACTIONS = ['recognize-rash', 'call-senior', 'request-bloods',
  'record-antimicrobial-intent', 'record-fluid-intent', 'escalate-consultant', 'review-boundaries',
  'monitor', 'check-labs', 'check-perfusion', 'reassess', 'handoff',
  'normal-markers-exclude', 'vaccination-excludes', 'delay-transfer-for-antibiotics'] as const;
export type MeningococcalSepsisAction = typeof MENINGOCOCCAL_SEPSIS_ACTIONS[number];
export interface MeningococcalSepsisEvent { readonly id: string; readonly message: string }

export function supportsMeningococcalSepsis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'meningococcal-sepsis-recognition-and-escalation'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'meningococcal-sepsis').length === 1
    && scenario.timeline.filter((event) => event.target === 'meningococcal-sepsis-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'meningococcal-sepsis-boundary').length === 1;
}

/**
 * Recognition, activation, bounded qualified-team intent, and consultant attendance have distinct
 * authored effects. Recorded intent is never a dose, and an hour without adequate response is a
 * separate teaching state from deterioration before any care.
 */
export class MeningococcalSepsis {
  private rashAt: number | null = null;
  private seniorAt: number | null = null;
  private bloodsAt: number | null = null;
  private antimicrobialAt: number | null = null;
  private fluidAt: number | null = null;
  private consultantAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private deteriorated = false;
  private responseChecked = false;
  private treatedObserved = false;
  private incompleteObserved = false;
  private attendanceObserved = false;
  private markerExclusionAttempted = false;
  private vaccinationExclusionAttempted = false;
  private transferDelayAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private labObservation: MeningococcalSepsisSnapshot['labObservation'] = null;
  private perfusionObservation: MeningococcalSepsisSnapshot['perfusionObservation'] = null;
  private observation: MeningococcalSepsisSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: MeningococcalSepsisSnapshot['ended'] = null;

  private treated() { return this.antimicrobialAt !== null && this.fluidAt !== null; }
  private clinicalState() { return JSON.stringify([this.vitals(), this.labs()]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): MeningococcalSepsisEvent[] {
    if (this.ended) return [];
    const terminal = this.antimicrobialAt === null && this.fluidAt === null && this.seniorAt === null
      ? MENINGOCOCCAL_SEPSIS_TAKEOVER_TICKS : MENINGOCOCCAL_SEPSIS_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: MeningococcalSepsisEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.deteriorated && !this.treated() && until >= MENINGOCOCCAL_SEPSIS_DELAY_TICKS) {
      due.push({ at: MENINGOCOCCAL_SEPSIS_DELAY_TICKS, apply: () => {
        this.change(() => { this.deteriorated = true; });
        events.push({ id: 'clinical-deterioration', message: 'Perfusion, mental state, and the rash worsen in this authored untreated contrast. Escalate qualified antimicrobial and fluid care with senior ownership; the teaching clock is not a safe waiting period, a nomogram, or a grading cutoff.' });
      } });
    }
    if (this.treated() && !this.responseChecked
      && until >= Math.max(this.antimicrobialAt!, this.fluidAt!) + MENINGOCOCCAL_SEPSIS_RESPONSE_TICKS) {
      due.push({ at: Math.max(this.antimicrobialAt!, this.fluidAt!) + MENINGOCOCCAL_SEPSIS_RESPONSE_TICKS, apply: () => {
        this.change(() => { this.responseChecked = true; });
        events.push({ id: 'response-checkpoint', message: 'The authored one-hour response review is due. Request current bedside findings and laboratory evidence together. Elapsed time after recorded antimicrobial and fluid intent establishes neither an adequate response, source control, nor permission to step down surveillance.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review rash recognition, senior ownership, blood sampling before antimicrobials, bounded antimicrobial and fluid intent, consultant attendance, and continuing surveillance. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): MeningococcalSepsisEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'recognize-rash':
        if (this.rashAt !== null) return events;
        this.rashAt = tick;
        return emit('rash-recognition', 'A non-blanching rash with lesions larger than 2 mm in a febrile, poorly perfused young person is a strongly suspected meningococcal pattern. Recognition is not a diagnosis: the absence of a rash would not exclude it, and petechiae are harder to see on brown, black, and tanned skin, so the whole body, conjunctivae, and soles are checked under good light.');
      case 'call-senior':
        if (this.seniorAt !== null) return events;
        this.seniorAt = tick;
        return emit('senior-ownership', 'A senior clinical decision maker is told this is a strongly suspected meningococcal presentation and owns the urgent assessment, alternative diagnoses, and antimicrobial timing. Telephone advice is ownership of a decision, not attendance at the bedside; care does not wait for acknowledgment.');
      case 'request-bloods':
        if (this.bloodsAt !== null) return events;
        this.bloodsAt = tick;
        return emit('bloods-requested', 'Blood culture, venous gas with glucose and lactate, full blood count, C-reactive protein, clotting, renal and liver evidence, and whole-blood meningococcal and pneumococcal PCR are requested. Sampling is arranged so it does not delay antimicrobial care; no sample is interpreted here as a rule-out.');
      case 'record-antimicrobial-intent':
        if (this.antimicrobialAt !== null) return events;
        this.change(() => { this.antimicrobialAt = tick; });
        return emit('antimicrobial-intent', 'Bounded qualified-team antimicrobial intent is recorded for delivery within one hour of arrival. No agent, dose, route, dilution, or infusion is selected here, and the recorded intent is neither a prescription nor proof that the drug reached the patient.');
      case 'record-fluid-intent':
        if (this.fluidAt !== null) return events;
        this.change(() => { this.fluidAt = tick; });
        return emit('fluid-and-critical-care-intent', 'Bounded qualified-team fluid intent is recorded together with a critical-care referral to review the need for central access and vasoactive support. The referral asks a qualified team to review that need; it does not start, choose, or titrate a vasoactive agent, and no bolus volume is prescribed here.');
      case 'escalate-consultant':
        if (this.consultantAt !== null) return events;
        // Attendance answers the authored one-hour review. Before that review has
        // fired there is no inadequate response to escalate, and accepting it early
        // would mask the untreated contrast this lesson exists to show.
        if (!this.responseChecked) {
          return emit('consultant-attendance-premature', 'Alerting a consultant to attend in person was not recorded yet. That escalation answers a specific finding, an inadequate response an hour after the recorded interventions, and that review has not happened. Senior ownership by telephone is already available and does not wait.');
        }
        this.change(() => { this.consultantAt = tick; });
        return emit('consultant-attendance', 'A consultant is alerted to attend in person because there was no adequate response within an hour of the recorded interventions. Attendance in person is a distinct escalation from earlier telephone ownership, and it neither replaces critical-care review nor certifies improvement.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries: a normal or unimpressive C-reactive protein, procalcitonin, or white cell count does not rule this out, and this patient is deliberately leucopenic with a lagging marker; prior MenACWY vaccination does not exclude meningococcal B disease; outside hospital, antimicrobial care must not delay transfer; and the fluid ceiling itself is contested, with the United Kingdom guidance capping a single bolus far below the international paediatric ceiling. No source control, lumbar puncture, imaging, or contact prophylaxis decision is made here.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continuous or at least half-hourly observations with a track-and-trigger tool and a recorded conscious level continue. A laboratory-only result or a perfusion-only look is useful but does not refresh the full bedside assessment.');
      case 'check-labs':
        this.labObservation = this.labFinding(tick);
        return emit('lab-check', `Requested fictional laboratory evidence: lactate ${this.labObservation.lactateMmolL.toFixed(1)} mmol/L; platelets ${this.labObservation.plateletsX109L} x10^9/L; C-reactive protein ${this.labObservation.crpMgL} mg/L; white cells ${this.labObservation.whiteCellsX109L.toFixed(1)} x10^9/L. A rising C-reactive protein is expected with time and is not by itself treatment failure, and this partial result supplies no current perfusion or conscious-level examination.`);
      case 'check-perfusion':
        this.perfusionObservation = this.perfusionFinding(tick);
        return emit('perfusion-check', `Requested examination: capillary refill ${this.perfusionObservation.capillaryRefillSeconds} s; conscious level ${this.perfusionObservation.glasgowComaScore}/15; rash ${this.perfusionObservation.spreadingPurpura ? 'spreading purpura' : 'petechiae with lesions larger than 2 mm'}. Capillary refill has no published threshold for this age band and is read as one supporting sign, not a number. This partial examination supplies no new laboratory evidence.`);
      case 'reassess': {
        this.labObservation = this.labFinding(tick);
        this.perfusionObservation = this.perfusionFinding(tick);
        this.observation = { ...this.labObservation, ...this.perfusionObservation, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.consultantAt !== null) this.attendanceObserved = true;
        else if (this.responseChecked) this.incompleteObserved = true;
        else if (this.treated()) this.treatedObserved = true;
        const view = this.observation;
        return emit(this.consultantAt !== null ? 'attendance-reassessment' : this.responseChecked ? 'incomplete-response-reassessment'
          : this.treated() ? 'treated-reassessment' : 'initial-reassessment',
        `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; BP ${view.systolicMmHg}/${view.diastolicMmHg} mmHg (MAP ${view.meanArterialMmHg}); respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% in air; temperature ${view.coreTemperatureC.toFixed(1)} C; capillary refill ${view.capillaryRefillSeconds} s; conscious level ${view.glasgowComaScore}/15; lactate ${view.lactateMmolL.toFixed(1)} mmol/L; platelets ${view.plateletsX109L} x10^9/L. ${view.spreadingPurpura ? 'The purpura is spreading.' : 'Petechiae persist with lesions larger than 2 mm.'} Recorded intent is not delivered treatment, and no source control, survival, or discharge readiness is established.`);
      }
      case 'normal-markers-exclude':
        this.markerExclusionAttempted = true;
        return emit('marker-exclusion-refused', 'Excluding sepsis on an unimpressive C-reactive protein and a low white cell count was refused. These markers lag in fulminant disease, and leucopenia here is an adverse sign rather than reassurance; no single laboratory value rules this presentation out.');
      case 'vaccination-excludes':
        this.vaccinationExclusionAttempted = true;
        return emit('vaccination-exclusion-refused', 'Excluding meningococcal disease because of prior MenACWY vaccination was refused. That programme does not cover serogroup B, which dominates adolescent invasive disease in the supplied surveillance, so a vaccinated adolescent with this pattern is not a contradiction.');
      case 'delay-transfer-for-antibiotics':
        this.transferDelayAttempted = true;
        return emit('transfer-delay-refused', 'Holding transfer to give antimicrobials outside hospital was refused. Pre-hospital antimicrobial care is given only when it does not delay reaching definitive care, and this rehearsal is already inside the hospital.');
      case 'handoff':
        if (this.rashAt === null || this.seniorAt === null || this.bloodsAt === null
          || this.antimicrobialAt === null || this.fluidAt === null || this.boundariesAt === null
          || this.monitoringAt === null || this.observation === null || this.observedPhase !== this.phase
          || (this.responseChecked && this.consultantAt === null)) {
          return emit('handoff-refused', 'Record rash recognition, senior ownership, blood sampling, bounded antimicrobial and fluid intent, the boundary review, surveillance, and a current full assessment. Consultant attendance is required only once the authored one-hour review has shown an inadequate response. A normal marker, a settled diagnosis, and a flawless history are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns current bedside and laboratory findings, delivered antimicrobial and fluid care, critical-care review of vasoactive and access needs, source and contact questions, and continued reassessment. Shock may still be unresolved and the diagnosis unconfirmed. Practice ends, not treatment, and neither survival nor recovery is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional meningococcal sepsis lesson. No care was started.');
    }
  }

  private labFinding(tick: number) {
    const values = this.consultantAt !== null ? { lactateMmolL: 2.9, plateletsX109L: 88, crpMgL: 148, whiteCellsX109L: 4.2 }
      : this.responseChecked ? { lactateMmolL: 4.4, plateletsX109L: 84, crpMgL: 96, whiteCellsX109L: 3.0 }
        : this.deteriorated ? { lactateMmolL: 6.8, plateletsX109L: 71, crpMgL: 62, whiteCellsX109L: 2.8 }
          : { lactateMmolL: 4.1, plateletsX109L: 96, crpMgL: 48, whiteCellsX109L: 3.4 };
    return { atTick: tick, ...values };
  }

  private perfusionFinding(tick: number) {
    const values = this.consultantAt !== null ? { capillaryRefillSeconds: 3, glasgowComaScore: 14, spreadingPurpura: true }
      : this.responseChecked ? { capillaryRefillSeconds: 4, glasgowComaScore: 13, spreadingPurpura: true }
        : this.deteriorated ? { capillaryRefillSeconds: 5, glasgowComaScore: 10, spreadingPurpura: true }
          : { capillaryRefillSeconds: 4, glasgowComaScore: 14, spreadingPurpura: false };
    return { atTick: tick, ...values };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    const circulation = this.consultantAt !== null
      ? { heartRateBpm: 128, systolicMmHg: 96, diastolicMmHg: 52, meanArterialMmHg: 67, respiratoryRateBpm: 26, spo2Percent: 96 }
      : this.responseChecked
        ? { heartRateBpm: 144, systolicMmHg: 84, diastolicMmHg: 42, meanArterialMmHg: 56, respiratoryRateBpm: 30, spo2Percent: 94 }
        : this.treated()
          ? { heartRateBpm: 136, systolicMmHg: 90, diastolicMmHg: 46, meanArterialMmHg: 61, respiratoryRateBpm: 28, spo2Percent: 96 }
          : this.deteriorated
            ? { heartRateBpm: 152, systolicMmHg: 76, diastolicMmHg: 36, meanArterialMmHg: 49, respiratoryRateBpm: 32, spo2Percent: 93 }
            : { heartRateBpm: 138, systolicMmHg: 88, diastolicMmHg: 44, meanArterialMmHg: 59, respiratoryRateBpm: 28, spo2Percent: 96 };
    return { ...circulation, coreTemperatureC: this.deteriorated && !this.treated() ? 38.6 : 39.2,
      alertness: this.deteriorated && !this.treated() ? 'drowsy and confused'
        : this.responseChecked && this.consultantAt === null ? 'intermittently confused' : 'irritable but rousable' };
  }

  private labs() { return this.labFinding(0); }

  snapshot(tick: number): MeningococcalSepsisSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return {
      rashRecognizedAtTick: this.rashAt, seniorAtTick: this.seniorAt, bloodsAtTick: this.bloodsAt,
      antimicrobialIntentAtTick: this.antimicrobialAt, fluidIntentAtTick: this.fluidAt,
      consultantAtTick: this.consultantAt, boundariesReviewedAtTick: this.boundariesAt,
      monitoringAtTick: this.monitoringAt,
      responseDueInSeconds: !this.ended && this.treated() && !this.responseChecked
        ? remaining(Math.max(this.antimicrobialAt!, this.fluidAt!), MENINGOCOCCAL_SEPSIS_RESPONSE_TICKS) : null,
      treatedResponseObserved: this.treatedObserved, incompleteResponseObserved: this.incompleteObserved,
      attendanceResponseObserved: this.attendanceObserved,
      markerExclusionAttempted: this.markerExclusionAttempted,
      vaccinationExclusionAttempted: this.vaccinationExclusionAttempted,
      transferDelayAttempted: this.transferDelayAttempted,
      labObservation: this.labObservation ? { ...this.labObservation } : null,
      perfusionObservation: this.perfusionObservation ? { ...this.perfusionObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
