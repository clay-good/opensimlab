import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { SilentInteractionSnapshot } from '@platform/kernel/protocol';
export type { SilentInteractionSnapshot } from '@platform/kernel/protocol';

/**
 * Every other lesson in this module has a finding. Something is abnormal, or somebody is
 * deteriorating, or a number is arriving that has to be read correctly. This one has nothing at
 * all: she feels well, every observation is normal, no test is abnormal, and the harm is that a
 * treatment is working less than it appears to be. What makes it findable is not observation but
 * reconciliation, and the thing to be found is an absence — a medicine that is not in the record.
 */
export const SILENT_INTERACTION_PHARMACY_TICKS = 20 * 60 * TICKS_PER_SECOND;
export const SILENT_INTERACTION_TEAM_TICKS = 40 * 60 * TICKS_PER_SECOND;
export const SILENT_INTERACTION_TAKEOVER_TICKS = 240 * 60 * TICKS_PER_SECOND;
export const SILENT_INTERACTION_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const SILENT_INTERACTION_ACTIONS = ['reconcile-what-she-is-actually-taking',
  'record-the-interaction-and-its-direction', 'escalate-to-the-treating-team-now',
  'record-bounded-treatment-intent', 'review-boundaries',
  'check-observations', 'check-the-supplied-records', 'reassess', 'handoff',
  'tell-her-to-stop-the-acid-tablets-today', 'nothing-is-wrong-so-there-is-nothing-to-do',
  'the-interaction-is-only-theoretical', 'write-it-in-the-notes-and-move-on'] as const;
export type SilentInteractionAction = typeof SILENT_INTERACTION_ACTIONS[number];
export interface SilentInteractionEvent { readonly id: string; readonly message: string }

export function supportsSilentInteraction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'silent-interaction-a-harm-with-nothing-to-find'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'silent-interaction').length === 1
    && scenario.timeline.filter((event) => event.target === 'silent-interaction-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'silent-interaction-boundary').length === 1;
}

export class SilentInteraction {
  private reconciledAt: number | null = null;
  private directionAt: number | null = null;
  private escalationAt: number | null = null;
  private intentAt: number | null = null;
  private boundariesAt: number | null = null;
  private pharmacyArrived = false;
  private teamResponded = false;
  private teamObserved = false;
  private stopAttempted = false;
  private nothingToDoAttempted = false;
  private theoreticalAttempted = false;
  private notesOnlyAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: SilentInteractionSnapshot['observationRecord'] = null;
  private recordCheck: SilentInteractionSnapshot['recordCheck'] = null;
  private observation: SilentInteractionSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: SilentInteractionSnapshot['ended'] = null;

  /**
   * Nothing about the patient moves and nothing is offered. What moves is the RECORD: at twenty
   * minutes the community pharmacy list arrives and contains something neither of the other two
   * lists held. A reconciliation done before it and one done after it are not the same
   * reconciliation, which is the whole argument of the lesson.
   */
  private clinicalState() {
    return JSON.stringify([this.pharmacyArrived, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): SilentInteractionEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? SILENT_INTERACTION_TAKEOVER_TICKS : SILENT_INTERACTION_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: SilentInteractionEvent[] = [];
    if (!this.pharmacyArrived && until >= SILENT_INTERACTION_PHARMACY_TICKS) {
      this.change(() => { this.pharmacyArrived = true; });
      events.push({ id: 'pharmacy-record-arrives', message: 'The community pharmacy list arrives and it is not the same as either of the other two. The clinic list has her targeted tablet and nothing else. Her general practice list has the acid tablet, started six weeks ago for reflux. The pharmacy list has both, plus an acid remedy she buys herself and did not count as medicine because nobody prescribed it. Three records, three different answers, and the only one that was ever going to contain all of it is the one that had to be asked for.' });
    }
    // The treating team owns every decision here, and only if somebody tells them.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + SILENT_INTERACTION_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'Her treating oncology team answers and takes it. They own whether the acid suppression is still needed at all, whether something without this interaction would do instead, what happens to her targeted treatment, and what is said to her about the weeks already taken. They ask for the dates rather than the diagnosis, because what they need to know is how long the two have overlapped, and they say the part worth carrying: nothing about her looked wrong, and that is the reason this kind of thing is usually found late or not at all.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review reconciling what she is actually taking, the interaction and the direction of its harm, escalation to the treating team, bounded treatment intent, and the boundaries. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): SilentInteractionEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'reconcile-what-she-is-actually-taking':
        if (this.reconciledAt !== null) return events;
        this.reconciledAt = tick;
        return emit('reconciled', `The three supplied lists are compared against each other rather than any one of them being trusted, and the record names what she is actually taking${this.pharmacyArrived ? ', including the remedy she buys herself, which appears on no prescribing record and which she did not think of as medicine' : ', with the community pharmacy list still outstanding and the reconciliation therefore incomplete'}. The question that finds this is not what has been prescribed. It is what she swallows.`);
      case 'record-the-interaction-and-its-direction':
        if (this.directionAt !== null) return events;
        this.directionAt = tick;
        return emit('direction-recorded', 'The interaction is recorded and so is the direction it runs. Most of these targeted tablets need an acid stomach to dissolve; suppressing the acid means less of the drug is absorbed. So the harm is less treatment, not more, and that is why nothing looks wrong: there is no rash, no derangement, no toxicity to notice. A harm that presents as an absence of anything cannot be caught by looking harder at the patient.');
      case 'escalate-to-the-treating-team-now':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `Her treating oncology team is called${this.pharmacyArrived ? ', with all three lists and the dates the overlap began' : ', with the lists so far and a note that the pharmacy record is outstanding'}. They hold the treatment decision and the prescribing record this fell out of. This is the action that closes the gap between the records rather than describing it.`);
      case 'record-bounded-treatment-intent':
        if (this.intentAt !== null) return events;
        this.intentAt = tick;
        return emit('intent-recorded', 'Bounded intent is recorded and nothing is started or stopped: that whether she still needs acid suppression, whether an alternative without this interaction is appropriate, what happens to the targeted treatment, and what she is told about the weeks already taken, all belong to the treating team and to whoever prescribed the acid tablet. No drug, dose, route, timing separation, or substitution is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. In a population study of 4,340 and 1,635 patients taking two of these targeted tablets, concurrent acid suppression was associated with shorter overall survival: adjusted hazard ratios of 1.58, 95% confidence interval 1.42 to 1.76, and 1.54, 95% confidence interval 1.30 to 1.82. Read that as what it is. It is retrospective, from prescribing and registry databases, and its authors write association rather than causation; people who are prescribed acid suppressants may differ from those who are not in ways no adjustment recovers. What supports it is that the mechanism is understood and points the same way. What it does not support is telling this woman that her treatment has been made ineffective.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; ${this.observationRecord.symptomAccount}. Everything here is normal, and it would be normal whatever the answer to this problem turns out to be. This partial check supplies no records.`);
      case 'check-the-supplied-records':
        this.recordCheck = this.recordFinding(tick);
        return emit('records-check', `Requested supplied records: the clinic list holds ${this.recordCheck.clinicListItems} item; the general practice list holds ${this.recordCheck.practiceListItems}; ${this.recordCheck.pharmacyListAvailable ? `the community pharmacy list holds ${this.recordCheck.pharmacyListItems}, including one item bought rather than prescribed` : 'the community pharmacy list has not arrived'}. The overlap began ${this.recordCheck.overlapWeeks} weeks ago. No test is acquired or interpreted by this learner. This partial check supplies no observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.recordCheck = this.recordFinding(tick);
        this.observation = { ...this.observationRecord, ...this.recordCheck, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on air; ${view.symptomAccount}. She is exactly as well as she was, which is the difficulty. ${this.teamResponded ? 'Her treating team has answered, owns the decision, and has asked for the dates of the overlap.' : this.pharmacyArrived ? 'The community pharmacy list has arrived and holds an item neither other list did.' : 'The community pharmacy list is still outstanding.'} No diagnosis beyond the supplied records, treatment effect, or outcome is established here.`);
      }
      case 'tell-her-to-stop-the-acid-tablets-today':
        this.stopAttempted = true;
        return emit('stop-refused', 'Telling her to stop the acid tablets today was refused. She was given them for a reason and may still need them, the choice between stopping, substituting something without this interaction, and separating the timing is a prescribing decision belonging to her teams, and an instruction issued from here that reaches neither of the records this fell out of repeats the original fault in the opposite direction. The finding is yours to make and hand over. The change is not yours to make.');
      case 'nothing-is-wrong-so-there-is-nothing-to-do':
        this.nothingToDoAttempted = true;
        return emit('nothing-refused', 'Concluding that nothing is wrong and there is nothing to do was refused, and it is the most understandable answer in this lesson. She feels well, every observation is normal, and no test is abnormal — and none of that is evidence, because the harm here is a treatment working less than it appears to be. There was never going to be anything to see. The absence of an abnormality is the presentation, not the reassurance.');
      case 'the-interaction-is-only-theoretical':
        this.theoreticalAttempted = true;
        return emit('theoretical-refused', 'Dismissing this as a theoretical interaction was refused, and so is the opposite overstatement. The mechanism is understood — these tablets need an acid stomach to dissolve — and in nearly six thousand patients across two of them, concurrent acid suppression was associated with adjusted hazard ratios for death of 1.58 and 1.54, with confidence intervals that do not cross one. That is more than theory and less than proof: the studies are retrospective and their authors say association. Neither word in front of you is the right one to use.');
      case 'write-it-in-the-notes-and-move-on':
        this.notesOnlyAttempted = true;
        return emit('notes-refused', 'Writing it in the notes and moving on was refused. The record is precisely where this problem already happened: three lists existed, each one true, and none of them reached the person prescribing. Adding a fourth entry that nobody has been asked to read does not close a gap between records; it documents one. What changes something here is telling the team that holds the treatment decision, by a route that ends with a person.');
      case 'handoff':
        if (this.reconciledAt === null || this.directionAt === null || this.escalationAt === null
          || this.intentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Reconcile what she is actually taking, record the interaction and the direction of its harm, call the treating team now, record bounded qualified-team intent, review the boundaries, and take a current assessment. A stopped tablet, a normal set of observations, and a note in the record are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The treating team owns whether the acid suppression continues, whether something without this interaction replaces it, what happens to the targeted treatment, and what she is told. What travels is all three supplied lists and how they differ, the item that was bought rather than prescribed, the ${this.recordCheck?.overlapWeeks ?? 6} weeks the two have overlapped, that the direction of harm is reduced treatment rather than toxicity so nothing will look wrong later either, ${this.notesOnlyAttempted ? 'that recording it without telling anyone was considered and not taken, ' : ''}and ${this.teamObserved ? 'that they have accepted it and asked for the dates' : 'that they have been called and have not yet answered'}. Practice ends, not care, and no diagnosis, treatment effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional medicines-reconciliation lesson. No care was started or changed.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 74,
      systolicMmHg: 124, diastolicMmHg: 78,
      respiratoryRateBpm: 16,
      spo2Percent: 98, coreTemperatureC: 36.6,
      symptomAccount: 'no new symptoms, and she reports feeling well' };
  }

  private recordFinding(tick: number) {
    return { atTick: tick, clinicListItems: 1, practiceListItems: 4,
      pharmacyListAvailable: this.pharmacyArrived,
      pharmacyListItems: this.pharmacyArrived ? 6 : 0,
      overlapWeeks: 6 };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Normal, and normal in every state. A fixture that let anything drift would teach that this
    // is findable by observation, which is the belief the lesson exists to remove.
    return { heartRateBpm: 74, systolicMmHg: 124, diastolicMmHg: 78,
      meanArterialMmHg: 93, respiratoryRateBpm: 16,
      spo2Percent: 98, coreTemperatureC: 36.6,
      alertness: 'well, and entirely without complaint' };
  }

  snapshot(_tick: number): SilentInteractionSnapshot {
    return {
      reconciledAtTick: this.reconciledAt, directionRecordedAtTick: this.directionAt,
      escalationAtTick: this.escalationAt, treatmentIntentAtTick: this.intentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      overlapWeeks: 6,
      // False in every state, and that is the lesson. There is nothing to find by looking.
      anyAbnormalFinding: false,
      pharmacyRecordArrived: this.pharmacyArrived,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      stopInstructionAttempted: this.stopAttempted,
      nothingToDoAttempted: this.nothingToDoAttempted,
      theoreticalAttempted: this.theoreticalAttempted,
      notesOnlyAttempted: this.notesOnlyAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      recordCheck: this.recordCheck ? { ...this.recordCheck } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
