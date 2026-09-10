import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { KnownLabelSnapshot } from '@platform/kernel/protocol';
export type { KnownLabelSnapshot } from '@platform/kernel/protocol';

/**
 * A diagnosis that explains everything, and is probably right.
 *
 * He has chronic constipation on his record and he almost certainly still has it. That is what
 * makes the label dangerous rather than what makes it wrong: it accounts for the abdomen, the
 * not eating and the distress, so nothing is left over to be curious about. The only person in
 * the department who can tell today from every other day is the support worker who has known
 * him for six years, and her shift ends at four.
 *
 * It is the module's fifth lesson about holding a position, and its fifth pressure. In
 * `negative-scan` the pressure is an investigation, in `unfinished-survey` a bed, in
 * `quiet-chest` a patient who wants to go home, in `third-attendance` two colleagues'
 * conclusions. Here it is a true label already in the chart, and the lesson is not that the
 * label is wrong — the evidence carried here says it is very likely right, and that a patient
 * like him carries about eleven true labels at once. It is that a label explains; it does not
 * exclude.
 */
export const KNOWN_LABEL_HANDOVER_TICKS = 14 * 60 * TICKS_PER_SECOND;
export const KNOWN_LABEL_TEAM_TICKS = 35 * 60 * TICKS_PER_SECOND;
export const KNOWN_LABEL_TAKEOVER_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const KNOWN_LABEL_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const KNOWN_LABEL_ACTIONS = ['record-the-label-and-what-it-explains',
  'record-what-has-changed-according-to-someone-who-knows-him', 'record-what-the-label-cannot-exclude',
  'escalate-to-the-surgical-team', 'record-bounded-adjustment-intent', 'review-boundaries',
  'check-observations', 'check-behaviour-record', 'reassess', 'handoff',
  'this-is-his-baseline-behaviour', 'the-notes-say-chronic-constipation',
  'he-cannot-tell-us-where-it-hurts-so-we-cannot-assess-him', 'give-him-something-for-his-bowels-and-review'] as const;
export type KnownLabelAction = typeof KNOWN_LABEL_ACTIONS[number];
export interface KnownLabelEvent { readonly id: string; readonly message: string }

export function supportsKnownLabel(scenario: Scenario): boolean {
  return scenario.metadata.id === 'known-label-an-explanation-that-excludes-nothing'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'known-label').length === 1
    && scenario.timeline.filter((event) => event.target === 'known-label-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'known-label-boundary').length === 1;
}

export class KnownLabel {
  private labelAt: number | null = null;
  private carerAccountAt: number | null = null;
  private exclusionLimitsAt: number | null = null;
  private escalationAt: number | null = null;
  private adjustmentIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private carerLeft = false;
  private teamResponded = false;
  private teamObserved = false;
  private baselineClaimAttempted = false;
  private labelClaimAttempted = false;
  private cannotAssessAttempted = false;
  private laxativeAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: KnownLabelSnapshot['observationRecord'] = null;
  private behaviourRecord: KnownLabelSnapshot['behaviourRecord'] = null;
  private observation: KnownLabelSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: KnownLabelSnapshot['ended'] = null;

  /**
   * Nothing measured moves. What the gate tracks is who is in the room, because the best
   * instrument available in this case is a person, and she is leaving.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.carerLeft, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): KnownLabelEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? KNOWN_LABEL_TAKEOVER_TICKS : KNOWN_LABEL_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: KnownLabelEvent[] = [];
    if (!this.carerLeft && until >= KNOWN_LABEL_HANDOVER_TICKS) {
      this.change(() => { this.carerLeft = true; });
      events.push({ id: 'carer-left', message: 'The support worker’s shift has ended and the relief worker has arrived. The relief worker has met him twice, is kind and willing, and cannot say whether today is different from last Tuesday. Nothing about the patient has changed: the same rocking, the same hand on the abdomen, the same refusal to sit. What has left the department is the only comparison anybody had.' });
    }
    // The surgical team is busy and takes thirty-five minutes, so waiting for it is never the
    // move that saves the account: that had to be written down before she left.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + KNOWN_LABEL_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The surgical team answers. They read the constipation as almost certainly still present and as explaining part of the picture rather than as excluding anything, take the recorded account of what changed as the history it is, and take ownership of the examination with whatever adjustments and time it needs, of any investigation, and of the decision about whether he stays.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded label and what it explains, what changed according to somebody who knows him, what the label cannot exclude, and escalation to the team that owns the assessment. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): KnownLabelEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-label-and-what-it-explains':
        if (this.labelAt !== null) return events;
        this.labelAt = tick;
        return emit('label-recorded', 'The label is recorded together with the work it is doing: chronic constipation, on his record for years, almost certainly still true, and capable of explaining the abdomen, the not eating and the distress all at once. It is written down as an explanation rather than as a finding from today, because a diagnosis that accounts for everything leaves nothing for anybody to be curious about, and that is its whole effect on this assessment.');
      case 'record-what-has-changed-according-to-someone-who-knows-him':
        if (this.carerAccountAt !== null) return events;
        this.carerAccountAt = tick;
        return emit('carer-account-recorded', `The account of the person who can compare today with every other day is recorded as history, in her words and with her name and her six years attached${this.carerLeft ? ' — recorded after she left, from what was said before she went, which is worth less than it would have been' : ', while she is still here'}. He is quiet rather than agitated, which is the wrong way round for him. He will not sit. He refused the thing he never refuses. She has seen his constipation many times and says this is not it. That is not an opinion about a diagnosis; it is an observation nobody else in the building is able to make.`);
      case 'record-what-the-label-cannot-exclude':
        if (this.exclusionLimitsAt !== null) return events;
        this.exclusionLimitsAt = tick;
        return emit('exclusion-limits-recorded', 'What the label cannot do is recorded explicitly. It is very probably correct and it excludes nothing: in a population-based study of 1,023 adults with intellectual disabilities the mean number of physical health conditions was 11.04 and 98.7 percent were multimorbid, with constipation among the five most prevalent. A true label in a record like his is one of about eleven true labels, and no member of that set rules out any other. What is recorded is that the constipation and something else are not competing explanations.');
      case 'escalate-to-the-surgical-team':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The team that owns the assessment is asked to see him, ${this.carerLeft ? 'with the recorded account passed on as history and the fact that its author has gone home stated plainly' : 'with the support worker still present and able to answer questions directly'}. The reason given is what is true: a documented change reported by somebody who has known him for six years, an abdomen nobody has yet examined in a way he can take part in, and a label that explains without excluding. No suggestion is made that the constipation is absent.`);
      case 'record-bounded-adjustment-intent':
        if (this.adjustmentIntentAt !== null) return events;
        this.adjustmentIntentAt = tick;
        return emit('adjustment-intent-recorded', 'Bounded intent is recorded and nothing is arranged: that the qualified team owns the examination and whatever time, quiet, familiar person, or other adjustment it needs to happen at all, owns any investigation and how it is explained to him, owns any prescribing, and owns whether he stays. What is recorded alongside is that an examination he cannot take part in is a limitation of the examination rather than a fact about him. No drug, dose, route, investigation, or procedure is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, and the strongest of them argues that the label is right. A cross-sectional study of 1,023 adults with intellectual disabilities found a mean of 11.04 physical conditions each and multimorbidity in 98.7 percent, with constipation among the five most prevalent conditions — so betting on the label is a good bet and always will be. Against that, a population-based confidential inquiry reviewing 247 deaths found 22 percent died before 50, a median age at death of 64 against 78 for men and 83 for women in the general population, and deaths from causes amenable to good healthcare in 37 percent against 13 percent in the general population, with carers not feeling listened to among the factors significantly associated with premature death at p equals 0.006. A narrative review for emergency physicians describes the same pattern under the name diagnostic overshadowing and names carers and family as vital informants; it is a review rather than a measurement and is quoted for its framing. None of this says the constipation is absent. What it says is that being usually right is exactly how a label stops anybody looking.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. This partial check supplies no behaviour record. The pulse is a little fast and nothing here is alarming, which is what a chart looks like when the patient cannot describe anything.`);
      case 'check-behaviour-record':
        this.behaviourRecord = this.behaviourFinding(tick);
        return emit('behaviour-record-check', `Requested behaviour and history record: ${this.behaviourRecord.label} on the record for ${this.behaviourRecord.labelYears} years; usual response to distress ${this.behaviourRecord.usualDistress}; today ${this.behaviourRecord.todayDescription}; eating ${this.behaviourRecord.eatingToday ? 'as usual' : 'nothing since yesterday'}; informant ${this.behaviourRecord.informantYears} years, ${this.behaviourRecord.informantPresent ? 'present' : 'shift ended and gone home'}; abdominal examination he could take part in ${this.behaviourRecord.examinationAchieved ? 'achieved' : 'not achieved'}. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.behaviourRecord = this.behaviourFinding(tick);
        this.observation = { ...this.observationRecord, ...this.behaviourRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; temperature ${view.coreTemperatureC.toFixed(1)} C; informant ${view.informantPresent ? 'present' : 'gone home'}; examination he could take part in ${view.examinationAchieved ? 'achieved' : 'still not achieved'}; ${view.alertness}. ${this.teamResponded ? 'The team has answered, reads the constipation as explaining rather than excluding, and owns the examination with its adjustments, any investigation, and whether he stays.' : 'Nothing measured has moved, and nothing measured is going to.'} No diagnosis, cause, treatment effect, or outcome is established here.`);
      }
      case 'this-is-his-baseline-behaviour':
        this.baselineClaimAttempted = true;
        return emit('baseline-claim-refused', 'Filing today as his baseline was refused. Somebody who has known him for six years has said it is not, and she is the only person here with anything to compare it against; the record you are reading was written by people who met him for an hour each. A baseline is a claim about what is usual, and usual is precisely the thing you do not have access to and she does.');
      case 'the-notes-say-chronic-constipation':
        this.labelClaimAttempted = true;
        return emit('label-claim-refused', 'Letting the label close the assessment was refused. Nobody is disputing it: he very likely does have chronic constipation, today as on every other day. That is the difficulty rather than the answer, because a diagnosis that explains the abdomen, the not eating and the distress leaves no remainder to be curious about, and in a record carrying about eleven true conditions no one of them excludes any other.');
      case 'he-cannot-tell-us-where-it-hurts-so-we-cannot-assess-him':
        this.cannotAssessAttempted = true;
        return emit('cannot-assess-refused', 'Treating his communication as the end of the assessment was refused. What is true is that the usual examination will not work, which is a statement about the method rather than about him; what follows is a different method — more time, a quieter space, a familiar person present, and the history taken from somebody who can give it. Recording "unable to assess" converts an adjustment nobody made into a property of the patient.');
      case 'give-him-something-for-his-bowels-and-review':
        this.laxativeAttempted = true;
        return emit('laxative-trial-refused', 'Treating the label and reviewing was refused. He may well need that and prescribing is the qualified team’s; what is refused is using it as the test. If it works you will conclude the label was the whole story, and if it does not you will have spent the interval and lost the informant, and neither outcome tells you what the person who knows him was trying to say.');
      case 'handoff':
        if (this.labelAt === null || this.carerAccountAt === null || this.exclusionLimitsAt === null
          || this.escalationAt === null || this.adjustmentIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the label and what it explains, record what changed according to somebody who knows him, record what the label cannot exclude, ask the team that owns the assessment to see him, record bounded qualified-team intent, review the boundaries, and take a current full assessment. A diagnosis, a completed examination, and a disposition are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the examination and its adjustments, any investigation and how it is explained to him, any prescribing, and whether he stays. What travels is the label with the work it was doing, the recorded account of what changed and who gave it, that the label explains without excluding, that no examination he could take part in has yet happened, and the bounded intent as theirs, and ${this.teamObserved ? 'that they have read the constipation the same way and are coming to examine him properly' : 'that they have been asked and have not yet answered'}. Practice ends, not care, and no diagnosis or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional recording and escalation lesson. No care was started.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 104, systolicMmHg: 138, diastolicMmHg: 82,
      respiratoryRateBpm: 18, spo2Percent: 97, coreTemperatureC: 37.1 };
  }

  private behaviourFinding(tick: number) {
    return { atTick: tick, label: 'chronic constipation', labelYears: 9,
      usualDistress: 'loud, agitated, and self-injurious',
      todayDescription: 'quiet, rocking, one hand held flat on the abdomen, will not sit down',
      eatingToday: false, informantYears: 6, informantPresent: !this.carerLeft,
      examinationAchieved: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // A slightly fast pulse and nothing else, holding still all the way through. This is what
    // a chart looks like when the patient cannot describe anything, and it decides nothing.
    return { heartRateBpm: 104, systolicMmHg: 138, diastolicMmHg: 82, meanArterialMmHg: 101,
      respiratoryRateBpm: 18, spo2Percent: 97, coreTemperatureC: 37.1,
      alertness: 'awake, quiet rather than agitated, rocking, and keeping one hand flat on his abdomen' };
  }

  snapshot(_tick: number): KnownLabelSnapshot {
    return {
      labelRecordedAtTick: this.labelAt,
      carerAccountRecordedAtTick: this.carerAccountAt,
      exclusionLimitsRecordedAtTick: this.exclusionLimitsAt,
      escalationAtTick: this.escalationAt,
      adjustmentIntentAtTick: this.adjustmentIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      labelYears: 9,
      informantYears: 6,
      // True in every state: nobody has managed an examination he can take part in, and the
      // label is never withdrawn or confirmed by anything in this lesson.
      examinationAchieved: false,
      labelPresent: true,
      informantPresent: !this.carerLeft,
      carerLeft: this.carerLeft,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      baselineClaimAttempted: this.baselineClaimAttempted,
      labelClaimAttempted: this.labelClaimAttempted,
      cannotAssessAttempted: this.cannotAssessAttempted,
      laxativeAttempted: this.laxativeAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      behaviourRecord: this.behaviourRecord ? { ...this.behaviourRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
