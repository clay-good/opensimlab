import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LaboratoryTlsSnapshot } from '@platform/kernel/protocol';
export type { LaboratoryTlsSnapshot } from '@platform/kernel/protocol';

/**
 * A definition applied to blood results is not a description of a patient. This lesson exists
 * because the ward is split between two readings that are both wrong — that he has a syndrome, and
 * that nothing is happening — and because the gap between the laboratory picture and the clinical
 * one is not an error in the definition. It is the window the definition exists to open.
 */
export const LABORATORY_TLS_REPEAT_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const LABORATORY_TLS_TEAM_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const LABORATORY_TLS_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const LABORATORY_TLS_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const LABORATORY_TLS_ACTIONS = ['record-which-definition-is-met',
  'record-what-crossed-and-when', 'record-the-crossing-risk', 'escalate-to-the-treating-team',
  'record-bounded-monitoring-and-treatment-intent', 'review-boundaries',
  'check-observations', 'check-the-bloods', 'reassess', 'handoff',
  'he-is-well-so-it-is-just-numbers', 'call-it-tumour-lysis-and-move-him-to-intensive-care',
  'wait-for-the-next-set-before-telling-anyone', 'treat-the-potassium-and-stand-down'] as const;
export type LaboratoryTlsAction = typeof LABORATORY_TLS_ACTIONS[number];
export interface LaboratoryTlsEvent { readonly id: string; readonly message: string }

export function supportsLaboratoryTls(scenario: Scenario): boolean {
  return scenario.metadata.id === 'laboratory-tls-a-syndrome-he-does-not-have-yet'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'laboratory-tls').length === 1
    && scenario.timeline.filter((event) => event.target === 'laboratory-tls-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'laboratory-tls-boundary').length === 1;
}

export class LaboratoryTls {
  private definitionAt: number | null = null;
  private crossingAt: number | null = null;
  private riskAt: number | null = null;
  private escalationAt: number | null = null;
  private intentAt: number | null = null;
  private boundariesAt: number | null = null;
  private repeatReturned = false;
  private teamResponded = false;
  private teamObserved = false;
  private dismissalAttempted = false;
  private overcallAttempted = false;
  private waitAttempted = false;
  private standDownAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: LaboratoryTlsSnapshot['observationRecord'] = null;
  private bloodRecord: LaboratoryTlsSnapshot['bloodRecord'] = null;
  private observation: LaboratoryTlsSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: LaboratoryTlsSnapshot['ended'] = null;

  /**
   * The bloods move and the patient does not, which is the whole lesson, so the freshness gate has
   * to track the bloods. A gate on the observations alone would let a learner hand over a
   * laboratory picture two sets out of date while reporting a patient who is unchanged.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.repeatReturned, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): LaboratoryTlsEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? LABORATORY_TLS_TAKEOVER_TICKS : LABORATORY_TLS_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: LaboratoryTlsEvent[] = [];
    if (!this.repeatReturned && until >= LABORATORY_TLS_REPEAT_TICKS) {
      this.change(() => { this.repeatReturned = true; });
      events.push({ id: 'repeat-returned', message: 'The repeat set comes back. The phosphate has risen again and the corrected calcium has fallen further. The creatinine is unchanged, he is passing urine, the rhythm strip is sinus, and he is sitting up asking when he can have breakfast. The laboratory picture has moved and the patient has not: that gap is not a contradiction to be resolved in favour of one of them.' });
    }
    // Nobody arrives unbidden. The failure this lesson can produce is a ward arguing about a label
    // while the people who own the treatment are not told either reading.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + LABORATORY_TLS_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The treating haematology team answers. They accept the laboratory definition as met and the clinical one as not, take ownership of hydration, hypouricaemic treatment, monitoring frequency, and any renal referral, and ask to be told again if the creatinine moves or the rhythm changes rather than when the next number crosses a line.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review which definition is met and which is not, what crossed and how long after treatment, what raises the risk of crossing over, and escalation to the team that owns the treatment. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): LaboratoryTlsEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-which-definition-is-met':
        if (this.definitionAt !== null) return events;
        this.definitionAt = tick;
        return emit('definition-recorded', 'The record names which definition is met and which is not: the laboratory criteria are met, the clinical criteria are not. The distinction is not a technicality. In the series that introduced the two terms, laboratory tumour lysis was defined on the movement of the blood results alone and clinical tumour lysis required the laboratory picture plus a consequence — a potassium above 6, a creatinine above 221 micromoles per litre, a calcium below 1.5, a life-threatening arrhythmia, or sudden death. He has the first and none of the second, and writing "tumour lysis syndrome" without saying which loses exactly the thing the next reader needs.');
      case 'record-what-crossed-and-when':
        if (this.crossingAt !== null) return events;
        this.crossingAt = tick;
        return emit('crossing-recorded', 'What crossed and when is recorded together: a rise in phosphate, potassium and urate with a fall in corrected calcium, 18 hours after the first cycle. The timing is part of the finding. Laboratory changes are described within the first 6 to 24 hours and the first clinical signs at 48 to 72 hours, so a laboratory picture at 18 hours is early in a window rather than late in an event.');
      case 'record-the-crossing-risk':
        if (this.riskAt !== null) return events;
        this.riskAt = tick;
        return emit('risk-recorded', 'What makes crossing over more likely in this patient is recorded rather than assumed: a high-grade lymphoma with bulky disease and a high pre-treatment urate, and — the factor the original series identified — pre-treatment renal function, which here is normal. Clinical tumour lysis occurred more often in the patients who came in with renal impairment. Recording that his was normal is not reassurance; it is the number the next person will want when they decide how closely to watch him.');
      case 'escalate-to-the-treating-team':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The treating haematology team is contacted with both halves stated together: the laboratory definition is met, the clinical one is not, ${this.repeatReturned ? 'and the repeat set has moved further while he has not' : 'and this is 18 hours after the first cycle'}. The call reports a trajectory and asks for the monitoring and treatment decisions that belong to them. It is neither an alarm nor a courtesy.`);
      case 'record-bounded-monitoring-and-treatment-intent':
        if (this.intentAt !== null) return events;
        this.intentAt = tick;
        return emit('intent-recorded', 'Bounded intent is recorded and nothing is given: that the qualified team owns hydration, hypouricaemic treatment, the frequency of monitoring, electrolyte management, and any renal referral or dialysis decision, and that what would change the plan is a clinical consequence rather than another number crossing a line. No drug, dose, route, fluid rate, or threshold is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. The published rates disagree with each other and with themselves. In the 102-patient series that defined the terms, laboratory tumour lysis occurred in 42 percent and clinical in 6 percent. A 788-patient European review found hyperuricaemia in 18.9 percent, of whom 27.8 percent met tumour-lysis criteria — about 5 percent of everyone — and its authors noted the rates were lower than earlier reports. A 2024 review restated that second study as a laboratory rate of 18.9 percent, which is not what it measured. None of these is a probability for this man, they are drawn from different eras of prophylaxis, and the disagreement is the reason to record what was measured in front of you rather than the name of a syndrome.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C; rhythm ${this.observationRecord.rhythm}; urine output ${this.observationRecord.urineOutput}. This partial check supplies no blood results.`);
      case 'check-the-bloods':
        this.bloodRecord = this.bloodFinding(tick);
        return emit('bloods-check', `Requested bloods at ${this.bloodRecord.hoursAfterTreatment} hours after treatment: phosphate, potassium and urate ${this.bloodRecord.risingSet ? 'risen again from the previous set' : 'risen from pre-treatment'}; corrected calcium fallen; creatinine ${this.bloodRecord.creatinineUnchanged ? 'unchanged' : 'changed'}. Laboratory criteria ${this.bloodRecord.laboratoryCriteriaMet ? 'met' : 'not met'}; clinical criteria ${this.bloodRecord.clinicalCriteriaMet ? 'met' : 'not met'}. This partial check supplies no observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.bloodRecord = this.bloodFinding(tick);
        this.observation = { ...this.observationRecord, ...this.bloodRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; rhythm ${view.rhythm}; urine output ${view.urineOutput}; creatinine ${view.creatinineUnchanged ? 'unchanged' : 'changed'}; ${view.alertness}. Laboratory criteria ${view.laboratoryCriteriaMet ? 'met' : 'not met'}, clinical criteria ${view.clinicalCriteriaMet ? 'met' : 'not met'}. ${this.teamResponded ? 'The treating team has answered and owns hydration, hypouricaemic treatment, monitoring, and any renal referral.' : 'The bloods have moved further than he has.'} No diagnosis of clinical tumour lysis, treatment effect, or outcome is established here.`);
      }
      case 'he-is-well-so-it-is-just-numbers':
        this.dismissalAttempted = true;
        return emit('dismissal-refused', 'Filing it as numbers in a well patient was refused. The laboratory definition exists precisely because it is met before anything is visible: the laboratory changes are described at 6 to 24 hours and the first clinical signs at 48 to 72. A patient who looks well 18 hours after treatment is the expected appearance of the thing being watched for, not evidence against it.');
      case 'call-it-tumour-lysis-and-move-him-to-intensive-care':
        this.overcallAttempted = true;
        return emit('overcall-refused', 'Calling it tumour lysis syndrome and moving him was refused, for two separate reasons. He meets the laboratory definition and not the clinical one, and recording the name without the qualifier is the error this lesson is about. And the level of care he needs is a decision belonging to the qualified team, taken on his trajectory rather than on a label; in the defining series, only 6 percent of patients reached the clinical definition at all.');
      case 'wait-for-the-next-set-before-telling-anyone':
        this.waitAttempted = true;
        return emit('wait-refused', 'Waiting for the next set before telling anyone was refused. The people who own the hydration, the hypouricaemic treatment, and the monitoring interval are the people who decide when the next set is taken, so waiting for it defers the decision to the thing the decision was supposed to determine. There is a trajectory to report now, and reporting a trajectory is not the same as raising an alarm.');
      case 'treat-the-potassium-and-stand-down':
        this.standDownAttempted = true;
        return emit('stand-down-refused', 'Treating the potassium and standing down was refused. Electrolyte treatment is a qualified-team decision and no agent is exposed here; and a single corrected value does not close a process that is still 30 hours short of when clinical signs are described. Correcting one number and recording the problem as handled is how a laboratory picture becomes a clinical one unobserved.');
      case 'handoff':
        if (this.definitionAt === null || this.crossingAt === null || this.riskAt === null
          || this.escalationAt === null || this.intentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record which definition is met and which is not, record what crossed and how long after treatment, record what raises the risk of crossing over, contact the treating team, record bounded qualified-team monitoring and treatment intent, review the boundaries, and take a current assessment including the latest bloods. A resolved biochemistry and a named syndrome are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns hydration, hypouricaemic treatment, monitoring frequency, electrolyte management, and any renal referral. What travels is that the laboratory definition is met and the clinical one is not, what crossed and how long after treatment, that his pre-treatment renal function was normal, the bounded treatment intent as the qualified team’s decision, and ${this.teamObserved ? 'that the treating team has asked to be told if the creatinine moves or the rhythm changes rather than when the next number crosses a line' : 'that the treating team has been contacted and has not yet answered'}. Practice ends, not care, and no clinical tumour lysis, treatment effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional laboratory tumour-lysis lesson. No care was started.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 86, systolicMmHg: 126, diastolicMmHg: 74,
      respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.8,
      rhythm: 'sinus', urineOutput: 'passing urine freely' };
  }

  private bloodFinding(tick: number) {
    return { atTick: tick, hoursAfterTreatment: this.repeatReturned ? 19 : 18,
      risingSet: this.repeatReturned, creatinineUnchanged: true,
      laboratoryCriteriaMet: true, clinicalCriteriaMet: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // He stays well throughout. If he deteriorated, the definition would settle itself and the
    // lesson would stop being about what a definition is for.
    return { heartRateBpm: 86, systolicMmHg: 126, diastolicMmHg: 74, meanArterialMmHg: 91,
      respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.8,
      alertness: 'alert, orientated, and asking when he can have breakfast' };
  }

  snapshot(_tick: number): LaboratoryTlsSnapshot {
    return {
      definitionRecordedAtTick: this.definitionAt, crossingRecordedAtTick: this.crossingAt,
      riskRecordedAtTick: this.riskAt, escalationAtTick: this.escalationAt,
      treatmentIntentAtTick: this.intentAt, boundariesReviewedAtTick: this.boundariesAt,
      hoursAfterTreatment: this.repeatReturned ? 19 : 18,
      // Met and not met, in every state of this lesson. The gap is the teaching, not a defect.
      laboratoryCriteriaMet: true,
      clinicalCriteriaMet: false,
      repeatReturned: this.repeatReturned,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      dismissalAttempted: this.dismissalAttempted,
      overcallAttempted: this.overcallAttempted,
      waitForNextSetAttempted: this.waitAttempted,
      standDownAttempted: this.standDownAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      bloodRecord: this.bloodRecord ? { ...this.bloodRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
