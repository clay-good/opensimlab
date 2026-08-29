import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LoweringTheCountSnapshot } from '@platform/kernel/protocol';
export type { LoweringTheCountSnapshot } from '@platform/kernel/protocol';

/**
 * The sibling lesson in this module teaches that a definition met by blood results is not a
 * patient. This is its inverse and had to be built not to read as its duplicate: here the count is
 * genuinely part of the emergency, and the trap is the opposite one — an intervention that visibly
 * lowers it and has never been shown to make anybody live longer.
 */
export const LOWERING_THE_COUNT_DETERIORATION_TICKS = 20 * 60 * TICKS_PER_SECOND;
export const LOWERING_THE_COUNT_TEAM_TICKS = 40 * 60 * TICKS_PER_SECOND;
export const LOWERING_THE_COUNT_TAKEOVER_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const LOWERING_THE_COUNT_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const LOWERING_THE_COUNT_ACTIONS = ['record-the-clinical-picture-not-the-count',
  'record-what-the-count-does-and-does-not-license', 'escalate-to-haematology-now',
  'record-bounded-cytoreduction-intent', 'review-boundaries',
  'check-observations', 'check-the-supplied-results', 'reassess', 'handoff',
  'send-him-for-apheresis-and-stand-down', 'the-count-alone-makes-the-diagnosis',
  'wait-for-the-marrow-before-calling', 'treat-the-confusion-as-delirium'] as const;
export type LoweringTheCountAction = typeof LOWERING_THE_COUNT_ACTIONS[number];
export interface LoweringTheCountEvent { readonly id: string; readonly message: string }

export function supportsLoweringTheCount(scenario: Scenario): boolean {
  return scenario.metadata.id === 'lowering-the-count-a-number-that-can-be-moved'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'lowering-the-count').length === 1
    && scenario.timeline.filter((event) => event.target === 'lowering-the-count-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'lowering-the-count-boundary').length === 1;
}

export class LoweringTheCount {
  private pictureAt: number | null = null;
  private licenceAt: number | null = null;
  private escalationAt: number | null = null;
  private intentAt: number | null = null;
  private boundariesAt: number | null = null;
  private worsened = false;
  private teamResponded = false;
  private teamObserved = false;
  private apheresisStandDownAttempted = false;
  private countOnlyAttempted = false;
  private waitAttempted = false;
  private deliriumAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: LoweringTheCountSnapshot['observationRecord'] = null;
  private resultRecord: LoweringTheCountSnapshot['resultRecord'] = null;
  private observation: LoweringTheCountSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: LoweringTheCountSnapshot['ended'] = null;

  /**
   * This is the only lesson in the module where the patient himself deteriorates, so the gate
   * tracks the observations as well as the conversation. He is the thing that is moving.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.worsened, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): LoweringTheCountEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? LOWERING_THE_COUNT_TAKEOVER_TICKS : LOWERING_THE_COUNT_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: LoweringTheCountEvent[] = [];
    if (!this.worsened && until >= LOWERING_THE_COUNT_DETERIORATION_TICKS) {
      this.change(() => { this.worsened = true; });
      events.push({ id: 'clinically-worse', message: 'He is more breathless and harder to rouse than he was twenty minutes ago. The white cell count on the supplied film has not changed, because a count taken an hour ago cannot change. What is deteriorating is the patient, and it is the part that was already abnormal — the breathing and the conscious level — that is deteriorating.' });
    }
    // Haematology is the only route to definitive treatment, and only if somebody rings.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + LOWERING_THE_COUNT_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'Haematology answers and is coming. They accept clinical leukostasis as the working problem, take ownership of the cytoreduction strategy, transfusion decisions, tumour-lysis prophylaxis, and definitive treatment, and say plainly that whichever route they choose, the thing that changes his outcome is starting treatment for the leukaemia rather than any single manoeuvre on the count.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the clinical picture rather than the count alone, what the count does and does not license, immediate escalation to haematology, and bounded cytoreduction intent. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): LoweringTheCountEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-clinical-picture-not-the-count':
        if (this.pictureAt !== null) return events;
        this.pictureAt = tick;
        return emit('picture-recorded', 'The record names the clinical picture and not just the number: a white cell count of 240 with blasts on the supplied film, together with breathlessness at rest and confusion. The pulmonary and neurological findings are what make this leukostasis rather than a high count, and they are the findings most strongly linked to early death. A count on its own is a reason to look for them; it is not the thing being described.');
      case 'record-what-the-count-does-and-does-not-license':
        if (this.licenceAt !== null) return events;
        this.licenceAt = tick;
        return emit('licence-recorded', 'What the count licenses is recorded, and so is what it does not. Up to 20 percent of acute myeloid leukaemia presents with a count above 100, early mortality is high, and emergent cytoreduction is indicated — but the optimal strategy is unknown, and a systematic review found no standardised guidelines for managing it. So the count licenses urgency and it does not select a manoeuvre. Those are different conclusions and they are routinely collapsed into one.');
      case 'escalate-to-haematology-now':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `Haematology is called immediately${this.worsened ? ', with the deterioration in his breathing and conscious level stated as it stands' : ''}. The call gives the count, the pulmonary and neurological findings, and the time they began. This is the action with the shortest path to definitive treatment, and it is available now, from here, without waiting for anything else to come back.`);
      case 'record-bounded-cytoreduction-intent':
        if (this.intentAt !== null) return events;
        this.intentAt = tick;
        return emit('intent-recorded', 'Bounded intent is recorded and nothing is started: that the qualified team owns the cytoreduction strategy and its route, transfusion decisions, tumour-lysis prophylaxis, supportive care, and definitive treatment of the leukaemia. No drug, dose, route, product, threshold, or procedure is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. The intervention that most obviously lowers the count has not been shown to lower early mortality: across 13 retrospective two-arm studies of 1,743 patients, the risk ratio for early death with leukapheresis was 0.88 with a confidence interval from 0.69 to 1.13, and the authors argue against its routine use. Read that carefully in both directions — it is a confidence interval that includes benefit as well as harm, from retrospective studies whose own data show the confounding: patients with clinical leukostasis tended to be more likely to receive it, at an odds ratio of about 2. This is not evidence that lowering the count is useless. It is evidence that nobody has shown it helps, in a literature where the sicker patients got it.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C; ${this.observationRecord.consciousLevel}. This partial check supplies no results.`);
      case 'check-the-supplied-results':
        this.resultRecord = this.resultFinding(tick);
        return emit('results-check', `Requested supplied results: white cell count ${this.resultRecord.whiteCellCount} times ten to the ninth per litre with blasts on the film, taken ${this.resultRecord.resultAgeMinutes} minutes ago; no marrow result; leukostasis is ${this.resultRecord.leukostasisIsClinical ? 'a clinical designation rather than a laboratory one' : 'defined by the count'}. No test is acquired or interpreted by this learner. This partial check supplies no observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.resultRecord = this.resultFinding(tick);
        this.observation = { ...this.observationRecord, ...this.resultRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on air; ${view.consciousLevel}. The supplied count is unchanged because it is the same sample. ${this.teamResponded ? 'Haematology has answered and is coming, and owns the cytoreduction strategy and the definitive treatment.' : this.worsened ? 'He is worse than he was, in the breathing and the conscious level.' : 'He is as he was.'} No diagnosis beyond the supplied film, treatment effect, or outcome is established here.`);
      }
      case 'send-him-for-apheresis-and-stand-down':
        this.apheresisStandDownAttempted = true;
        return emit('apheresis-refused', 'Sending him for apheresis and treating the problem as solved was refused, and the refusal is about the standing down. In a meta-analysis of 13 retrospective studies and 1,743 patients, leukapheresis did not improve early mortality, with a risk ratio of 0.88 and a confidence interval from 0.69 to 1.13, and its authors argue against routine use. Selecting the route of cytoreduction is a qualified-team decision in any case. Watching a number fall is the most convincing feedback available here and it is not evidence that anything has been achieved.');
      case 'the-count-alone-makes-the-diagnosis':
        this.countOnlyAttempted = true;
        return emit('count-only-refused', 'Making the diagnosis on the count alone was refused. Leukostasis is a clinical designation: it is the breathlessness and the confusion that place him in the group with high early mortality, and a count above 100 without them is a different situation with a different urgency. Recording the number instead of the findings hands the next person the one part of this that any laboratory could have told them.');
      case 'wait-for-the-marrow-before-calling':
        this.waitAttempted = true;
        return emit('wait-refused', 'Waiting for the marrow before calling haematology was refused. Clinical choices here matter within the first hours, the film already shows blasts, and the call is the shortest path to the only thing that treats the underlying disease. A confirmatory result changes who is certain, not what needs to happen next, and it will arrive after the window in which this is decided.');
      case 'treat-the-confusion-as-delirium':
        this.deliriumAttempted = true;
        return emit('delirium-refused', 'Treating the confusion as delirium and observing was refused. The neurological findings are not a complication of being unwell in hospital here; with the pulmonary findings they are the two features most strongly linked to early death in this presentation, and they are the reason this is an emergency rather than an abnormal blood count. Reclassifying them as delirium removes the very thing that made the diagnosis.');
      case 'handoff':
        if (this.pictureAt === null || this.licenceAt === null || this.escalationAt === null
          || this.intentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the clinical picture rather than the count alone, record what the count does and does not license, call haematology now, record bounded qualified-team cytoreduction intent, review the boundaries, and take a current assessment. A marrow result, a chosen cytoreduction route, and a falling count are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the cytoreduction strategy and its route, transfusion, tumour-lysis prophylaxis, and definitive treatment. What travels is the count with the pulmonary and neurological findings that make it leukostasis, the time those began, ${this.worsened ? 'that he deteriorated in both while this was being arranged, ' : ''}that urgency is licensed and no particular manoeuvre is, and ${this.teamObserved ? 'that haematology has accepted it and is coming' : 'that haematology has been called and has not yet answered'}. Practice ends, not care, and no diagnosis, treatment effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional hyperleukocytosis lesson. No care was started.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: this.worsened ? 118 : 108,
      systolicMmHg: 108, diastolicMmHg: 62,
      respiratoryRateBpm: this.worsened ? 32 : 26,
      spo2Percent: this.worsened ? 89 : 92, coreTemperatureC: 37.4,
      consciousLevel: this.worsened ? 'rousable to voice, answering in single words'
        : 'confused but conversational' };
  }

  private resultFinding(tick: number) {
    return { atTick: tick, whiteCellCount: 240, resultAgeMinutes: 60,
      leukostasisIsClinical: true, marrowAvailable: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // The one lesson in this module where the patient moves. What deteriorates is what was
    // already abnormal, and the supplied count cannot change, because it is the same sample.
    return { heartRateBpm: this.worsened ? 118 : 108, systolicMmHg: 108, diastolicMmHg: 62,
      meanArterialMmHg: 77, respiratoryRateBpm: this.worsened ? 32 : 26,
      spo2Percent: this.worsened ? 89 : 92, coreTemperatureC: 37.4,
      alertness: this.worsened ? 'rousable to voice, answering in single words'
        : 'confused but conversational' };
  }

  snapshot(_tick: number): LoweringTheCountSnapshot {
    return {
      pictureRecordedAtTick: this.pictureAt, licenceRecordedAtTick: this.licenceAt,
      escalationAtTick: this.escalationAt, treatmentIntentAtTick: this.intentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      whiteCellCount: 240,
      // Clinical in every state. The count is never what makes this the diagnosis.
      leukostasisIsClinical: true,
      clinicallyWorse: this.worsened,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      apheresisStandDownAttempted: this.apheresisStandDownAttempted,
      countOnlyAttempted: this.countOnlyAttempted,
      waitForMarrowAttempted: this.waitAttempted,
      deliriumAttempted: this.deliriumAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      resultRecord: this.resultRecord ? { ...this.resultRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
