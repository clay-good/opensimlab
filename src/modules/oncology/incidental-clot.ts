import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { IncidentalClotSnapshot } from '@platform/kernel/protocol';
export type { IncidentalClotSnapshot } from '@platform/kernel/protocol';

/**
 * A finding whose management is only conditionally supported, on evidence the panel itself rated
 * very low. This lesson exists because both reflexes are wrong in the same way: "incidental, so
 * nothing to do" and "a PE, so anticoagulate" each answer a question the evidence has not settled,
 * and each skips the person whose bleeding risk and preference are the deciding inputs.
 */
export const INCIDENTAL_CLOT_QUESTION_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const INCIDENTAL_CLOT_SERVICE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const INCIDENTAL_CLOT_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const INCIDENTAL_CLOT_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const INCIDENTAL_CLOT_ACTIONS = ['record-the-finding-and-how-it-was-found',
  'record-the-certainty-of-the-recommendation', 'record-the-benefit-and-the-harm-together',
  'record-this-patients-bleeding-risk', 'escalate-to-the-treating-service',
  'record-the-decision-as-shared', 'review-boundaries',
  'check-observations', 'check-the-report', 'reassess', 'handoff',
  'incidental-so-no-action-needed', 'a-pe-is-a-pe-so-anticoagulate-now',
  'wait-for-symptoms-before-deciding', 'leave-it-for-the-clinic-letter'] as const;
export type IncidentalClotAction = typeof INCIDENTAL_CLOT_ACTIONS[number];
export interface IncidentalClotEvent { readonly id: string; readonly message: string }

export function supportsIncidentalClot(scenario: Scenario): boolean {
  return scenario.metadata.id === 'incidental-clot-a-decision-the-evidence-cannot-make'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'incidental-clot').length === 1
    && scenario.timeline.filter((event) => event.target === 'incidental-clot-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'incidental-clot-boundary').length === 1;
}

export class IncidentalClot {
  private findingAt: number | null = null;
  private certaintyAt: number | null = null;
  private tradeoffAt: number | null = null;
  private bleedingRiskAt: number | null = null;
  private escalationAt: number | null = null;
  private sharedDecisionAt: number | null = null;
  private boundariesAt: number | null = null;
  private patientAsked = false;
  private serviceResponded = false;
  private serviceObserved = false;
  private dismissAttempted = false;
  private reflexTreatmentAttempted = false;
  private waitAttempted = false;
  private deferAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: IncidentalClotSnapshot['observationRecord'] = null;
  private reportRecord: IncidentalClotSnapshot['reportRecord'] = null;
  private observation: IncidentalClotSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: IncidentalClotSnapshot['ended'] = null;

  /**
   * This patient is well and stays well, so a freshness gate on vitals alone would be inert. What
   * moves is whether he has asked his question and whether his own team has answered, which is
   * what a reassessment would actually report.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.patientAsked, this.serviceResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): IncidentalClotEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? INCIDENTAL_CLOT_TAKEOVER_TICKS : INCIDENTAL_CLOT_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: IncidentalClotEvent[] = [];
    if (!this.patientAsked && until >= INCIDENTAL_CLOT_QUESTION_TICKS) {
      this.change(() => { this.patientAsked = true; });
      events.push({ id: 'patient-question', message: 'He asks the question himself: if he feels completely well, does he have to have this treatment, and what happens if he does not. He adds, without being asked, that the bleeding from his bowel frightened him more than anything else has, and that he would rather not be frightened like that again. He is not refusing anything. He is telling you the input the guidance says belongs to him.' });
    }
    // Nobody rings back unbidden. The failure this lesson can produce is a decision taken alone.
    if (!this.serviceResponded && this.escalationAt !== null
      && until >= this.escalationAt + INCIDENTAL_CLOT_SERVICE_TICKS) {
      this.change(() => { this.serviceResponded = true; });
      events.push({ id: 'service-responded', message: 'The treating oncology service answers. They accept the finding, agree it needs a decision rather than an automatic action, and take ownership of whether to anticoagulate, with what, and for how long. They ask that the bleeding history and what he said about it travel with the referral, because those are the inputs the recommendation says should decide it.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded finding, the certainty behind the recommendation, the benefit and the harm stated together, this patient’s bleeding risk, and a decision recorded as shared rather than taken alone. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): IncidentalClotEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-finding-and-how-it-was-found':
        if (this.findingAt !== null) return events;
        this.findingAt = tick;
        return emit('finding-recorded', 'The finding is recorded with how it was found: a segmental pulmonary embolus reported on a computed tomogram performed four days ago to assess response, not because anyone suspected an embolus. That is what the word incidental means in the literature — a pulmonary embolism diagnosed on a scan not performed for suspected pulmonary embolism. It describes the route to the finding. It says nothing about the clot.');
      case 'record-the-certainty-of-the-recommendation':
        if (this.certaintyAt !== null) return events;
        this.certaintyAt = tick;
        return emit('certainty-recorded', 'The strength and certainty are recorded alongside the recommendation, not underneath it. The guideline panel suggests short-term anticoagulation rather than observation for incidental pulmonary embolism in cancer: a conditional recommendation on very low certainty in the evidence of effects. The panel found no systematic review and no randomised trial that addressed the question, judged the certainty very low for risk of bias, inconsistency and imprecision, and named it a research priority. A conditional recommendation is not a weak instruction. It is an instruction to decide with the patient.');
      case 'record-the-benefit-and-the-harm-together':
        if (this.tradeoffAt !== null) return events;
        this.tradeoffAt = tick;
        return emit('tradeoff-recorded', 'Both directions are recorded together, because either alone is a different lesson. From the panel’s own figures, treatment may mean about 89 fewer deaths per 1000 and about 77 fewer symptomatic pulmonary emboli per 1000, and about 128 more major bleeds per 1000, all on very uncertain evidence. In the registry cohort the panel drew on, during anticoagulation the rate of major bleeding exceeded the rate of symptomatic pulmonary embolism, and the rate of fatal bleeding exceeded the rate of fatal pulmonary embolism; those authors concluded the risk-benefit ratio is uncertain and needs further study. Nothing here is being hidden from him.');
      case 'record-this-patients-bleeding-risk':
        if (this.bleedingRiskAt !== null) return events;
        this.bleedingRiskAt = tick;
        return emit('bleeding-risk-recorded', 'This patient’s own bleeding risk is recorded rather than assumed: intermittent bleeding from the primary tumour over the past two months, most recently last week, with a haemoglobin that has drifted down and no transfusion. The guidance is explicit that caution is needed to keep a favourable balance when anticoagulating patients at higher bleeding risk. Recording it is not deciding against treatment; it is putting the number that decides in front of the people deciding.');
      case 'escalate-to-the-treating-service':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The treating oncology service is contacted, ${this.patientAsked ? 'with the finding, the bleeding history, and what he said about it stated together' : 'with the finding and the bleeding history stated together'}. The referral asks for a decision rather than reporting one, because whether to anticoagulate, with what, and for how long is theirs, and the finding reached this clinic before it reached them.`);
      case 'record-the-decision-as-shared':
        if (this.sharedDecisionAt !== null) return events;
        this.sharedDecisionAt = tick;
        return emit('shared-decision-recorded', `The record states that this is a decision to be made with him and not for him: that the recommendation is conditional, that the benefit and the harm were put to him in the same conversation, that his bleeding history and his own account of it are inputs rather than background${this.patientAsked ? ', and that he raised it himself before he was asked' : ''}. The guidance is that any consideration of treatment should rest on the individual risk of thrombosis and of major bleeding after full discussion of the potential benefits and harms. No agreement is recorded here, because none has been reached.`);
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. Incidental pulmonary embolism is reported in roughly 3 percent of cancer patients, and the pooled analysis that underpins most of what is known followed 926 patients from 11 cohorts, where six-month mortality was about 37 percent — that figure belongs to the illness these patients have, not to the clot or to the treatment. The panel’s estimates come from observational data, not trials. The registry cohort points the other way on bleeding. Subsegmental clots carried a comparable recurrence risk to more proximal ones in the pooled analysis, so the size of the clot does not settle this either. None of this makes the finding unimportant. It makes it a decision.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. He remains without chest symptoms. This partial check supplies neither the report nor the bleeding history.`);
      case 'check-the-report':
        this.reportRecord = this.reportFinding(tick);
        return emit('report-check', `Requested report: a ${this.reportRecord.clotLocation} pulmonary embolus, reported ${this.reportRecord.reportedDaysAgo} days ago on a scan performed ${this.reportRecord.scanIndication}; ${this.reportRecord.acknowledgedInRecord ? 'acknowledged in the record' : 'not yet acknowledged anywhere in the record'}. This partial check supplies no observations and no bleeding history.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.reportRecord = this.reportFinding(tick);
        this.observation = { ...this.observationRecord, ...this.reportRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.serviceResponded) this.serviceObserved = true;
        const view = this.observation;
        return emit(this.serviceResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on air; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.alertness}. ${this.serviceResponded ? 'The treating service has answered and owns the anticoagulation decision, its agent, and its duration.' : 'He is as well as he was, which is the same reason this is difficult and not a reason it can wait indefinitely.'} No diagnosis beyond the reported finding, treatment effect, or outcome is established here.`);
      }
      case 'incidental-so-no-action-needed':
        this.dismissAttempted = true;
        return emit('dismissal-refused', 'Filing it as an incidental finding with no action was refused. Incidental describes how the clot was found, not what it is: a pulmonary embolism diagnosed on a scan done for another reason. The guideline panel suggests treatment rather than observation for exactly this presentation, and the pooled data show recurrent venous thromboembolism in untreated patients at more than twice the rate seen under treatment. The uncertainty runs in both directions, and doing nothing is one of the two options, not the absence of a choice.');
      case 'a-pe-is-a-pe-so-anticoagulate-now':
        this.reflexTreatmentAttempted = true;
        return emit('reflex-refused', 'Starting anticoagulation now on the grounds that a pulmonary embolism is a pulmonary embolism was refused, for two reasons that are separate. Selecting and giving an anticoagulant is a treatment decision belonging to the qualified team, and this lesson exposes no drug. And the recommendation behind it is conditional on very low certainty, with a bleeding harm the panel judged large in a patient who is already bleeding — which is precisely the case the guidance says to weigh with the patient rather than settle on his behalf.');
      case 'wait-for-symptoms-before-deciding':
        this.waitAttempted = true;
        return emit('wait-refused', 'Waiting until he develops symptoms was refused. The pooled analysis found recurrence risk after a subsegmental clot comparable to that after a more proximal one, so the absence of symptoms is not a measure of how small the problem is, and a plan whose trigger is a symptom nobody has defined is not a plan. Deciding to observe is a legitimate option here; drifting into it is not the same thing.');
      case 'leave-it-for-the-clinic-letter':
        this.deferAttempted = true;
        return emit('defer-refused', 'Leaving it to be picked up in the clinic letter was refused. The report has existed for four days and has reached nobody who can act on it, which is how this finding is usually missed; a letter that arrives after the next appointment does not close that gap. The people who own the decision have to be told by someone who knows the finding is unacknowledged.');
      case 'handoff':
        if (this.findingAt === null || this.certaintyAt === null || this.tradeoffAt === null
          || this.bleedingRiskAt === null || this.escalationAt === null || this.sharedDecisionAt === null
          || this.boundariesAt === null || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the finding with how it was found, record the strength and certainty of the recommendation, record the benefit and the harm together, record this patient’s own bleeding risk, contact the treating service, record the decision as one to be made with him, review the boundaries, and take a current full assessment. An agreed plan, a chosen drug, and a resolved uncertainty are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns whether to anticoagulate, with what, for how long, and how to weigh the bleeding. What travels is the finding with how it was found, that the recommendation is conditional on very low certainty, the benefit and the harm as figures rather than as a conclusion, this patient’s bleeding history with his own account of it, and ${this.serviceObserved ? 'that the treating service has accepted the decision and asked for those inputs' : 'that the treating service has been contacted and has not yet answered'}. Practice ends, not care, and no decision, treatment, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional incidental-finding lesson. No care was started.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 78, systolicMmHg: 128, diastolicMmHg: 74,
      respiratoryRateBpm: 15, spo2Percent: 97, coreTemperatureC: 36.6 };
  }

  private reportFinding(tick: number) {
    return { atTick: tick, clotLocation: 'right lower lobe segmental', reportedDaysAgo: 4,
      scanIndication: 'to assess response to treatment rather than for suspected embolus',
      acknowledgedInRecord: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // He is well and stays well. A patient who deteriorated would answer the question for the
    // learner, and the question is the lesson.
    return { heartRateBpm: 78, systolicMmHg: 128, diastolicMmHg: 74, meanArterialMmHg: 92,
      respiratoryRateBpm: 15, spo2Percent: 97, coreTemperatureC: 36.6,
      alertness: 'alert, orientated, and entirely well in himself' };
  }

  snapshot(_tick: number): IncidentalClotSnapshot {
    return {
      findingRecordedAtTick: this.findingAt, certaintyRecordedAtTick: this.certaintyAt,
      tradeoffRecordedAtTick: this.tradeoffAt, bleedingRiskRecordedAtTick: this.bleedingRiskAt,
      escalationAtTick: this.escalationAt, sharedDecisionAtTick: this.sharedDecisionAt,
      boundariesReviewedAtTick: this.boundariesAt,
      // Both of these hold in every state. The recommendation never becomes strong, and the
      // evidence never becomes certain, however thoroughly the learner works.
      recommendationIsConditional: true,
      certaintyOfEvidence: 'very low',
      reportUnacknowledgedDays: 4,
      patientAsked: this.patientAsked,
      serviceResponded: this.serviceResponded,
      serviceObserved: this.serviceObserved,
      dismissalAttempted: this.dismissAttempted,
      reflexTreatmentAttempted: this.reflexTreatmentAttempted,
      waitForSymptomsAttempted: this.waitAttempted,
      deferralAttempted: this.deferAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      reportRecord: this.reportRecord ? { ...this.reportRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
