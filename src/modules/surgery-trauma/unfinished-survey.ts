import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { UnfinishedSurveySnapshot } from '@platform/kernel/protocol';
export type { UnfinishedSurveySnapshot } from '@platform/kernel/protocol';

/**
 * An examination that was performed on somebody who could not take part in it.
 *
 * The record says the secondary survey is complete, and it is: it was done, properly, on a
 * sedated and intubated man who could not report pain, could not move to command, and could
 * not be asked where it hurt. What the record cannot say is that he has no other injuries,
 * because the method that produces that sentence needs a patient who can answer.
 *
 * This is the module's third lesson and it returns to the posture of the first. The second
 * teaches that the harm is in the delay; this one teaches holding a position — that "not yet
 * cleared" is a finding worth defending against a ward that wants the bed, and that the third
 * survey exists precisely for the patient who never declared himself.
 */
export const UNFINISHED_SURVEY_WAKE_TICKS = 10 * 60 * TICKS_PER_SECOND;
export const UNFINISHED_SURVEY_TEAM_TICKS = 25 * 60 * TICKS_PER_SECOND;
export const UNFINISHED_SURVEY_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const UNFINISHED_SURVEY_SESSION_TICKS = 12 * 60 * 60 * TICKS_PER_SECOND;
export const UNFINISHED_SURVEY_ACTIONS = ['record-why-he-could-not-be-examined',
  'record-what-the-injury-list-rests-on', 'record-that-the-third-survey-is-not-done',
  'escalate-to-the-trauma-team', 'record-bounded-survey-intent', 'review-boundaries',
  'check-observations', 'check-injury-record', 'reassess', 'handoff',
  'the-secondary-survey-is-documented-complete', 'the-pan-scan-would-have-shown-it',
  'he-has-not-complained-of-anything', 'clear-him-now-and-review-if-something-appears'] as const;
export type UnfinishedSurveyAction = typeof UNFINISHED_SURVEY_ACTIONS[number];
export interface UnfinishedSurveyEvent { readonly id: string; readonly message: string }

export function supportsUnfinishedSurvey(scenario: Scenario): boolean {
  return scenario.metadata.id === 'unfinished-survey-a-patient-who-cannot-be-asked'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'unfinished-survey').length === 1
    && scenario.timeline.filter((event) => event.target === 'unfinished-survey-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'unfinished-survey-boundary').length === 1;
}

export class UnfinishedSurvey {
  private examinationLimitsAt: number | null = null;
  private injuryListAt: number | null = null;
  private surveyIncompleteAt: number | null = null;
  private escalationAt: number | null = null;
  private surveyIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private sedationLightened = false;
  private teamResponded = false;
  private teamObserved = false;
  private documentationClaimAttempted = false;
  private imagingClaimAttempted = false;
  private noComplaintClaimAttempted = false;
  private clearNowAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: UnfinishedSurveySnapshot['observationRecord'] = null;
  private injuryRecord: UnfinishedSurveySnapshot['injuryRecord'] = null;
  private observation: UnfinishedSurveySnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: UnfinishedSurveySnapshot['ended'] = null;

  /**
   * What moves here is not the patient. It is how much of him can be examined, which is why
   * the freshness gate tracks the sedation window rather than any observation.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.sedationLightened, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): UnfinishedSurveyEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? UNFINISHED_SURVEY_TAKEOVER_TICKS : UNFINISHED_SURVEY_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: UnfinishedSurveyEvent[] = [];
    if (!this.sedationLightened && until >= UNFINISHED_SURVEY_WAKE_TICKS) {
      this.change(() => { this.sedationLightened = true; });
      events.push({ id: 'sedation-lightened', message: 'Sedation is lightened for the routine neurological assessment. He opens his eyes, and he localises to the right but not with the left arm, which he does not move; when the left forearm is handled to reposition the line, he grimaces and pulls away. The ventilator, the drain, the pressures and every monitored number are exactly as they were. The ward has asked a second time whether he can be stepped down tonight.' });
    }
    // The trauma team answers only if it was called, and takes longer than this module's
    // second lesson, because what is being asked for is a deliberate reassessment rather than
    // a time-critical decision.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + UNFINISHED_SURVEY_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The trauma team answers. They check their own record, confirm that no tertiary survey has been documented, and state that the secondary survey entry records an examination rather than an absence of injury. They take ownership of completing the tertiary survey once he is awake enough to take part, of re-reviewing the admission imaging against a fresh examination, and of any further imaging or referral it generates.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded reasons he could not be examined, what the injury list actually rests on, that the third survey has not been done, and the request to the team that owns it. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): UnfinishedSurveyEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-why-he-could-not-be-examined':
        if (this.examinationLimitsAt !== null) return events;
        this.examinationLimitsAt = tick;
        return emit('examination-limits-recorded', `Why the examination was limited is recorded, in his notes, in plain words: at the time of the secondary survey he was sedated, intubated and ventilated, with a Glasgow Coma Scale of 6 recorded at the scene ${this.hoursSinceInjury()} hours ago. He could not report pain, could not move to command, and could not be asked where it hurt. This is recorded because the next person to read "secondary survey complete" needs to know what the patient was able to contribute to it.`);
      case 'record-what-the-injury-list-rests-on':
        if (this.injuryListAt !== null) return events;
        this.injuryListAt = tick;
        return emit('injury-list-recorded', `What the list rests on is recorded beside it: ${this.listedInjuries()} injuries identified, from reported whole-body imaging and an examination he could not take part in. The list is a record of what was found, not a statement that nothing else is there — and the largest group of injuries found late in the published series is exactly the group this method is worst at, the limbs.`);
      case 'record-that-the-third-survey-is-not-done':
        if (this.surveyIncompleteAt !== null) return events;
        this.surveyIncompleteAt = tick;
        return emit('survey-incomplete-recorded', 'That the assessment is unfinished is recorded as a live finding rather than an omission. The tertiary survey — the deliberate head-to-toe reexamination done once the patient can take part, with the imaging reviewed again beside it — has not been performed or documented. In the study that named this step, the recorded rate of missed injury was 2 percent until somebody went back and looked, and then it was 9. Recording that he is not yet fully assessed is the finding that keeps him from being treated as though he were.');
      case 'escalate-to-the-trauma-team':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The team that owns the survey is asked to complete it${this.sedationLightened ? ', with the left arm he does not move and the grimace on handling the forearm stated alongside the reason he could not be examined before' : ', with the reasons he could not be examined stated alongside the injuries already listed'}. The request is for a tertiary survey once he can take part and a re-review of the admission imaging against it. Nothing here asks permission to keep him; it states that the assessment is unfinished and who finishes it.`);
      case 'record-bounded-survey-intent':
        if (this.surveyIntentAt !== null) return events;
        this.surveyIntentAt = tick;
        return emit('survey-intent-recorded', 'Bounded intent is recorded and nothing is done: that the qualified team may reexamine him once sedation allows, may re-review the admission imaging, and may request further imaging, a specialty referral, or an operation. Which films, which specialty, and whether to operate are theirs. No investigation, drug, dose, route, or procedure is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, and they do not all point the same way. Prospectively surveying 399 admitted injured patients turned a registry rate of 2 percent into 41 missed injuries in 36 patients, 9 percent, of which 21 were extremity fractures and the commonest reason for missing them was an altered level of consciousness from head injury or alcohol; none died, one was left seriously disabled and seven needed an operation. A systematic review of ten observational studies put the injuries found by the third survey at 4.3 percent and those still missed by it at 1.5. But formalising the survey in 487 patients raised how often it was actually performed from 27 to 42 percent and did not reduce missed injuries at all — 3.8 against 4.8 percent in hospital, 13.7 against 11.5 at one month — with cumulative rates above 15 percent. The step is worth doing and the evidence that doing it fixes this is weak.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; ventilated at a set rate of ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}%; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. This partial check supplies no injury record and no examination history, and none of these numbers is abnormal.`);
      case 'check-injury-record':
        this.injuryRecord = this.injuryFinding(tick);
        return emit('injury-record-check', `Requested injury record: ${this.injuryRecord.mechanism}, ${this.injuryRecord.hoursSinceInjury} hours ago; ${this.injuryRecord.listedInjuries} injuries listed from ${this.injuryRecord.imagingReported ? 'reported whole-body imaging' : 'imaging not yet reported'} and a secondary survey documented as complete; sedated and ventilated ${this.injuryRecord.sedated ? 'now' : 'until the assessment window'}; tertiary survey ${this.injuryRecord.tertiarySurveyDocumented ? 'documented' : 'not documented'}. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.injuryRecord = this.injuryFinding(tick);
        this.observation = { ...this.observationRecord, ...this.injuryRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.hoursSinceInjury} hours since injury; ${view.listedInjuries} injuries listed; tertiary survey ${view.tertiarySurveyDocumented ? 'documented' : 'still not documented'}; ${view.alertness}. ${this.teamResponded ? 'The team has answered and owns completing the survey, re-reviewing the imaging, and anything that follows from it.' : 'The observations remain normal and the assessment remains unfinished.'} No diagnosis, missed injury, treatment effect, or outcome is established here.`);
      }
      case 'the-secondary-survey-is-documented-complete':
        this.documentationClaimAttempted = true;
        return emit('documentation-claim-refused', 'Treating the documentation as the assessment was refused. The entry is accurate: a secondary survey was performed and recorded. What it records is that somebody examined him, not that there is nothing else to find, and it was carried out on a man who could not report pain, move to command, or answer a question. A complete record of a limited examination is still a limited examination.');
      case 'the-pan-scan-would-have-shown-it':
        this.imagingClaimAttempted = true;
        return emit('imaging-claim-refused', 'Leaning on the whole-body imaging to exclude the rest was refused. The imaging is reported and its findings are in the list. In the series that defined this problem, 21 of 41 injuries found late were extremity fractures, and the limbs are largely outside what an admission trauma scan covers. Imaging answers the question it was pointed at; it does not answer the ones nobody has asked yet.');
      case 'he-has-not-complained-of-anything':
        this.noComplaintClaimAttempted = true;
        return emit('no-complaint-refused', 'Reading his silence as reassurance was refused. He is sedated, intubated, and was a Glasgow Coma Scale of 6 at the scene; he has not complained of anything because he cannot. An altered level of consciousness from head injury or alcohol was the commonest reason injuries were missed in the published series, which makes the absence of complaint the reason to look harder rather than the reason to stop.');
      case 'clear-him-now-and-review-if-something-appears':
        this.clearNowAttempted = true;
        return emit('clear-now-refused', 'Clearing him now and reviewing if something appears was refused. It inverts the method: the tertiary survey exists because these injuries do not announce themselves in a patient who cannot speak, so waiting for one to appear is waiting for the exact event the step is designed to pre-empt. The bed pressure is real and it is not a clinical finding. Stepping him down is not the objection; recording him as fully assessed when he has not been is.');
      case 'handoff':
        if (this.examinationLimitsAt === null || this.injuryListAt === null || this.surveyIncompleteAt === null
          || this.escalationAt === null || this.surveyIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record why he could not be examined, record what the injury list rests on, record that the third survey has not been done, ask the team that owns it to complete it, record bounded qualified-team intent, review the boundaries, and take a current full assessment. A completed tertiary survey, a named missed injury, and a disposition decision are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns completing the survey, re-reviewing the imaging, and anything that follows. What travels is why he could not be examined, what the injury list rests on, that the assessment is recorded as unfinished rather than clear, the request made to the team that owns it, the bounded intent as theirs, and ${this.teamObserved ? 'that they confirmed no tertiary survey had been documented and have taken it on' : 'that they have been asked and have not yet answered'}. Practice ends, not care, and no missed injury or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional reassessment lesson. No care was started.');
    }
  }

  private hoursSinceInjury() { return this.sedationLightened ? 15 : 14; }
  private listedInjuries() { return 4; }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 88, systolicMmHg: 118, diastolicMmHg: 68,
      respiratoryRateBpm: 14, spo2Percent: 98, coreTemperatureC: 36.8 };
  }

  private injuryFinding(tick: number) {
    return { atTick: tick, mechanism: 'motorcycle collision at speed, helmeted, thrown',
      hoursSinceInjury: this.hoursSinceInjury(), listedInjuries: this.listedInjuries(),
      imagingReported: true, sedated: !this.sedationLightened,
      tertiarySurveyDocumented: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Stable throughout, and deliberately so. Nothing a monitor shows will ever raise the
    // question this lesson is about, because an unexamined limb does not change a heart rate.
    return { heartRateBpm: 88, systolicMmHg: 118, diastolicMmHg: 68, meanArterialMmHg: 85,
      respiratoryRateBpm: 14, spo2Percent: 98, coreTemperatureC: 36.8,
      alertness: this.sedationLightened
        ? 'sedation lightened, eyes open, localising on the right and not moving the left arm'
        : 'sedated and ventilated, not able to report or localise' };
  }

  snapshot(_tick: number): UnfinishedSurveySnapshot {
    return {
      examinationLimitsRecordedAtTick: this.examinationLimitsAt,
      injuryListRecordedAtTick: this.injuryListAt,
      surveyIncompleteRecordedAtTick: this.surveyIncompleteAt,
      escalationAtTick: this.escalationAt,
      surveyIntentAtTick: this.surveyIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      hoursSinceInjury: this.hoursSinceInjury(),
      listedInjuries: this.listedInjuries(),
      // True in every state: the record is accurate and still does not say what it is read to say.
      secondarySurveyDocumented: true,
      tertiarySurveyDocumented: false,
      sedationLightened: this.sedationLightened,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      documentationClaimAttempted: this.documentationClaimAttempted,
      imagingClaimAttempted: this.imagingClaimAttempted,
      noComplaintClaimAttempted: this.noComplaintClaimAttempted,
      clearNowAttempted: this.clearNowAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      injuryRecord: this.injuryRecord ? { ...this.injuryRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
