import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { TrialRuleSnapshot } from '@platform/kernel/protocol';
export type { TrialRuleSnapshot } from '@platform/kernel/protocol';

/**
 * The module has now twice taught a learner to slow down, and a module that only ever teaches that
 * is teaching a reflex rather than a judgement. This lesson is the counterweight, and it is built
 * so that the shortcut arrives wearing the costume of caution: a rule that appears to license
 * waiting, cited by a colleague, written for handling data in trials rather than for managing this
 * patient, and carrying a condition — that she is clinically stable — which she does not meet.
 */
export const TRIAL_RULE_DOCUMENT_TICKS = 20 * 60 * TICKS_PER_SECOND;
export const TRIAL_RULE_TEAM_TICKS = 40 * 60 * TICKS_PER_SECOND;
export const TRIAL_RULE_TAKEOVER_TICKS = 150 * 60 * TICKS_PER_SECOND;
export const TRIAL_RULE_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const TRIAL_RULE_ACTIONS = ['record-the-clinical-trajectory-not-just-the-scan',
  'record-what-the-criteria-do-and-do-not-govern', 'escalate-to-the-treating-team-now',
  'record-bounded-treatment-intent', 'review-boundaries',
  'check-observations', 'check-the-supplied-imaging-report', 'reassess', 'handoff',
  'call-it-pseudoprogression-and-continue', 'stop-the-immunotherapy-and-tell-her-it-failed',
  'the-scan-alone-decides', 'rescan-in-eight-weeks-and-review-then'] as const;
export type TrialRuleAction = typeof TRIAL_RULE_ACTIONS[number];
export interface TrialRuleEvent { readonly id: string; readonly message: string }

export function supportsTrialRule(scenario: Scenario): boolean {
  return scenario.metadata.id === 'trial-rule-a-rule-written-for-a-database'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'trial-rule').length === 1
    && scenario.timeline.filter((event) => event.target === 'trial-rule-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'trial-rule-boundary').length === 1;
}

export class TrialRule {
  private trajectoryAt: number | null = null;
  private governanceAt: number | null = null;
  private escalationAt: number | null = null;
  private intentAt: number | null = null;
  private boundariesAt: number | null = null;
  private documentRead = false;
  private teamResponded = false;
  private teamObserved = false;
  private continueAttempted = false;
  private stopAttempted = false;
  private scanOnlyAttempted = false;
  private waitAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: TrialRuleSnapshot['observationRecord'] = null;
  private imagingRecord: TrialRuleSnapshot['imagingRecord'] = null;
  private observation: TrialRuleSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: TrialRuleSnapshot['ended'] = null;

  /**
   * What moves in this lesson is neither the patient nor the pressure but the RULE: at twenty
   * minutes the cited document itself arrives and turns out to say something different from what
   * it was quoted as saying. So the gate tracks that arrival, because a decision taken before
   * reading it and a decision taken after it are not the same decision.
   */
  private clinicalState() {
    return JSON.stringify([this.documentRead, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): TrialRuleEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? TRIAL_RULE_TAKEOVER_TICKS : TRIAL_RULE_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: TrialRuleEvent[] = [];
    if (!this.documentRead && until >= TRIAL_RULE_DOCUMENT_TICKS) {
      this.change(() => { this.documentRead = true; });
      events.push({ id: 'document-arrives', message: 'The criteria your colleague cited are on the screen in front of you now, and they say something narrower than they were quoted as saying. The allowance to keep treating past a radiological progression applies while the patient is clinically stable, and it exists so that a trial can decide later whether that progression was real. The working group that publishes them describes them as recommendations for data handling rather than patient management, and says they are not validated response criteria — the guideline was written partly to gather the data that would one day validate it. Nothing about her has changed while you read this. What has changed is that you now know what the rule was for.' });
    }
    // The treating team owns this decision, and only if somebody rings them.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + TRIAL_RULE_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'Her treating oncology team answers. They take ownership of whether the immunotherapy continues, whether a further line is offered, and what is said to her about either, and they will review her within days rather than at the eight-week scan. They say both errors are real ones: stopping an effective treatment early costs her the thing that was working, and holding a treatment while she declines costs her the time in which anything else could have been started. They ask what her trajectory has been, not what the scan showed.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the clinical trajectory rather than the scan alone, what the criteria do and do not govern, escalation to the treating team, bounded treatment intent, and the boundaries. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): TrialRuleEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-clinical-trajectory-not-just-the-scan':
        if (this.trajectoryAt !== null) return events;
        this.trajectoryAt = tick;
        return emit('trajectory-recorded', 'The record names the trajectory and not just the images: over three weeks she has gone from managing her own shopping to needing help to wash, she has lost six kilograms, and she is breathless crossing a room she used to cross easily. That is the direction and the rate, and it is the part of this that the scan cannot supply. A report describes a moment; what is being decided is about a slope.');
      case 'record-what-the-criteria-do-and-do-not-govern':
        if (this.governanceAt !== null) return events;
        this.governanceAt = tick;
        return emit('governance-recorded', `What the criteria govern is recorded, and so is what they do not. They were published to standardise data collection in trials of immunotherapies and to build the database that might one day validate them; the working group behind them describes them as recommendations for data handling rather than patient management. Their allowance to treat past a radiological progression is conditional on the patient being clinically stable, and confirmatory imaging is expected four to eight weeks later.${this.documentRead ? ' Having read them, the condition is the part that matters here: she is not clinically stable.' : ' The condition, not the allowance, is the part that decides whether they apply to her.'}`);
      case 'escalate-to-the-treating-team-now':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `Her treating oncology team is called${this.documentRead ? ', with what the cited criteria actually say stated as it stands' : ''}. The call gives the trajectory over three weeks, the supplied imaging report, and the fact that a decision is being held on a criterion whose own condition she does not meet. They hold the treatment record and the decision; this is the shortest path to somebody who can make it.`);
      case 'record-bounded-treatment-intent':
        if (this.intentAt !== null) return events;
        this.intentAt = tick;
        return emit('intent-recorded', 'Bounded intent is recorded and nothing is changed: that whether the immunotherapy continues, whether it stops, whether a further line is offered, whether best supportive care is the honest answer, and what she is told about any of it, all belong to the treating team. No drug, dose, route, cycle, interval, or line of therapy is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, and they cut both ways. Pseudoprogression is real and it is uncommon: reported rates do not exceed 10 percent of patients treated with checkpoint inhibitors, and the series behind the favourable outcomes are small. Hyperprogression is reported at between 4 and 29 percent depending on the study and the tumour, and in one non-small-cell lung cancer series it was 13.8 percent on immunotherapy against 5.1 percent on chemotherapy, with no established treatment described once it has happened. The published advice is to distinguish the two in order to avoid BOTH premature discontinuation of an effective treatment AND delay in starting a new line. Either error alone is a complete failure to read this.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; weight change ${this.observationRecord.weightChangeKg} kg over ${this.observationRecord.trajectoryWeeks} weeks; ${this.observationRecord.functionalAccount}. This partial check supplies no imaging report.`);
      case 'check-the-supplied-imaging-report':
        this.imagingRecord = this.imagingFinding(tick);
        return emit('imaging-check', `Requested supplied imaging report: restaging computed tomography at ${this.imagingRecord.weeksOnTreatment} weeks of treatment reports ${this.imagingRecord.newLesions ? 'new lesions and' : 'no new lesions but'} enlargement of existing disease, taken ${this.imagingRecord.reportAgeDays} days ago; ${this.imagingRecord.clinicallyStable ? 'the patient is clinically stable' : 'the patient is not clinically stable'}. No test is acquired or interpreted by this learner. This partial check supplies no observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.imagingRecord = this.imagingFinding(tick);
        this.observation = { ...this.observationRecord, ...this.imagingRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on air; ${view.functionalAccount}. The supplied report is unchanged because it is the same report. ${this.teamResponded ? 'Her treating team has answered, owns the decision, and will review her within days.' : this.documentRead ? 'The cited criteria have been read and their condition is clinical stability.' : 'Nothing new has arrived.'} No diagnosis beyond the supplied report, treatment effect, or outcome is established here.`);
      }
      case 'call-it-pseudoprogression-and-continue':
        this.continueAttempted = true;
        return emit('pseudoprogression-refused', 'Calling it pseudoprogression and continuing was refused, and the refusal is about the condition rather than about the phenomenon. Pseudoprogression is real, and the criterion that permits treating through a radiological progression permits it while the patient is clinically stable — which is the one thing she is not. Reported rates do not exceed 10 percent, hyperprogression is reported at between 4 and 29 percent, and continuing is not the neutral option it feels like: it spends the interval in which something else could have been started. This is also not this learner’s decision to make.');
      case 'stop-the-immunotherapy-and-tell-her-it-failed':
        this.stopAttempted = true;
        return emit('stop-refused', 'Stopping the immunotherapy and telling her it has failed was refused, and this is the opposite error rather than the safe one. Premature discontinuation of an effective treatment is exactly what the published advice names alongside delay as the thing to avoid, the imaging alone does not establish which of the two this is, and both the decision and the words she is given belong to the team holding her treatment record. Being the person who told her is not the same as being the person who knew.');
      case 'the-scan-alone-decides':
        this.scanOnlyAttempted = true;
        return emit('scan-only-refused', 'Letting the scan alone decide was refused, in either direction. The report is a single moment and the question is about a direction over weeks; the criterion that reads such a report attaches a clinical condition to its own use; and the two things it is trying to distinguish look identical on the images. Whichever way it is read, deciding from the report by itself discards the part of this that is actually informative.');
      case 'rescan-in-eight-weeks-and-review-then':
        this.waitAttempted = true;
        return emit('wait-refused', 'Booking a scan in eight weeks and reviewing then was refused. That interval belongs to a patient who is clinically stable and to a protocol that is collecting data, and it was written to let a trial classify a progression rather than to schedule this woman’s care. She has declined measurably in three weeks. An interval that assumes stability is not a plan for somebody who is not stable, and a review date is not a decision.');
      case 'handoff':
        if (this.trajectoryAt === null || this.governanceAt === null || this.escalationAt === null
          || this.intentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the clinical trajectory rather than the scan alone, record what the criteria do and do not govern, call the treating team now, record bounded qualified-team treatment intent, review the boundaries, and take a current assessment. A repeat scan, a decision about the drug, and a confirmed label are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The treating team owns whether the immunotherapy continues, whether a further line is offered, and what she is told. What travels is the trajectory over three weeks and its rate, the supplied report, that the criterion being cited governs trial data rather than her management and attaches a condition she does not meet, ${this.continueAttempted ? 'that continuing on that criterion was considered and not taken, ' : ''}${this.stopAttempted ? 'that stopping and telling her it had failed was considered and not taken, ' : ''}and ${this.teamObserved ? 'that they have accepted it and will review her within days' : 'that they have been called and have not yet answered'}. Practice ends, not care, and no diagnosis, treatment effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional response-assessment lesson. No care was started or stopped.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 96,
      systolicMmHg: 112, diastolicMmHg: 68,
      respiratoryRateBpm: 22,
      spo2Percent: 94, coreTemperatureC: 36.9,
      weightChangeKg: -6, trajectoryWeeks: 3,
      functionalAccount: 'needing help to wash, having managed her own shopping three weeks ago' };
  }

  private imagingFinding(tick: number) {
    return { atTick: tick, weeksOnTreatment: 9, reportAgeDays: 2,
      newLesions: true,
      // False in every state, and it is the whole lesson: the cited rule's condition is unmet.
      clinicallyStable: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Still, deliberately. She declined over weeks, not over the rehearsal; nothing the learner
    // does in this room changes her, and the fixture must not imply that anything could.
    return { heartRateBpm: 96, systolicMmHg: 112, diastolicMmHg: 68,
      meanArterialMmHg: 83, respiratoryRateBpm: 22,
      spo2Percent: 94, coreTemperatureC: 36.9,
      alertness: 'alert, tired, and answering fully' };
  }

  snapshot(_tick: number): TrialRuleSnapshot {
    return {
      trajectoryRecordedAtTick: this.trajectoryAt, governanceRecordedAtTick: this.governanceAt,
      escalationAtTick: this.escalationAt, treatmentIntentAtTick: this.intentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      pseudoprogressionCeilingPercent: 10,
      // False in every state. The criterion's own condition is the thing she does not meet.
      clinicallyStable: false,
      documentRead: this.documentRead,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      continueAttempted: this.continueAttempted,
      stopAttempted: this.stopAttempted,
      scanOnlyAttempted: this.scanOnlyAttempted,
      waitAttempted: this.waitAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      imagingRecord: this.imagingRecord ? { ...this.imagingRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
