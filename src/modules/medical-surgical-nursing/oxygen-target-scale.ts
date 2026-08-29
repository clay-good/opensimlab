import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { OxygenTargetScaleSnapshot } from '@platform/kernel/protocol';
export type { OxygenTargetScaleSnapshot } from '@platform/kernel/protocol';

/**
 * Every other escalation lesson ends with a score that should have been higher. This one ends with
 * a score that should be lower, which is harder, because a falling number feels like reassurance
 * and is not one. The saturation is correct, the patient is on her prescribed target, and the chart
 * is scoring her against a range nobody prescribed. The danger the guideline names is not the score
 * itself but what a score of 3 invites somebody to do about it.
 */
export const OXYGEN_TARGET_COLLEAGUE_TICKS = 10 * 60 * TICKS_PER_SECOND;
export const OXYGEN_TARGET_REVIEW_TICKS = 18 * 60 * TICKS_PER_SECOND;
export const OXYGEN_TARGET_TAKEOVER_TICKS = 90 * 60 * TICKS_PER_SECOND;
export const OXYGEN_TARGET_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const OXYGEN_TARGET_ACTIONS = ['check-the-prescription', 'check-the-chart',
  'record-the-scale-mismatch', 'rescore-on-the-prescribed-scale', 'record-what-the-rescore-changes',
  'confirm-the-scale-with-the-team', 'review-boundaries', 'monitor', 'reassess', 'handoff',
  'raise-the-oxygen-to-correct-it', 'assume-the-diagnosis-sets-the-scale',
  'a-lower-score-means-she-is-improving', 'score-both-and-take-the-higher'] as const;
export type OxygenTargetScaleAction = typeof OXYGEN_TARGET_ACTIONS[number];
export interface OxygenTargetScaleEvent { readonly id: string; readonly message: string }

/** The published SpO2 rows. Only scale 2 penalises a saturation that is too high, and only on oxygen. */
export const OXYGEN_TARGET_SCALE_ONE = [
  { score: 3, label: '91% or below' }, { score: 2, label: '92 to 93%' },
  { score: 1, label: '94 to 95%' }, { score: 0, label: '96% or above' },
] as const;
export const OXYGEN_TARGET_SCALE_TWO = [
  { score: 3, label: '83% or below, or 97% or above on oxygen' },
  { score: 2, label: '84 to 85%, or 95 to 96% on oxygen' },
  { score: 1, label: '86 to 87%, or 93 to 94% on oxygen' },
  { score: 0, label: '88 to 92%, or 93% or above on air' },
] as const;

/** The authored observation: 90% breathing air, which is inside her prescribed range. */
const SATURATION_PERCENT = 90;
const ON_SUPPLEMENTAL_OXYGEN = false;
const PRESCRIBED_TARGET_RANGE = '88 to 92%';

/** Scale 1 scores a number. Scale 2 scores a number against a target, and needs to know about air. */
export function oxygenTargetScore(scale: 1 | 2, saturation: number, onOxygen: boolean): number {
  if (scale === 1) return saturation <= 91 ? 3 : saturation <= 93 ? 2 : saturation <= 95 ? 1 : 0;
  if (saturation <= 83) return 3;
  if (saturation <= 85) return 2;
  if (saturation <= 87) return 1;
  if (saturation <= 92) return 0;
  if (!onOxygen) return 0;
  return saturation <= 94 ? 1 : saturation <= 96 ? 2 : 3;
}

export function supportsOxygenTargetScale(scenario: Scenario): boolean {
  return scenario.metadata.id === 'oxygen-target-scale-a-score-that-should-be-lower'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'oxygen-target-scale').length === 1
    && scenario.timeline.filter((event) => event.target === 'oxygen-target-scale-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'oxygen-target-scale-boundary').length === 1;
}

export class OxygenTargetScale {
  private prescriptionCheckedAt: number | null = null;
  private chartCheckedAt: number | null = null;
  private mismatchRecordedAt: number | null = null;
  private rescoredAt: number | null = null;
  private consequencesRecordedAt: number | null = null;
  private confirmationAt: number | null = null;
  private boundariesAt: number | null = null;
  private monitoringAt: number | null = null;
  private colleagueAsked = false;
  private reviewArrived = false;
  private reviewObserved = false;
  private oxygenRaiseAttempted = false;
  private scaleAssumed = false;
  private lowerScoreReadAsWell = false;
  private higherOfBothTaken = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private prescriptionRecord: OxygenTargetScaleSnapshot['prescriptionRecord'] = null;
  private chartRecord: OxygenTargetScaleSnapshot['chartRecord'] = null;
  private observation: OxygenTargetScaleSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: OxygenTargetScaleSnapshot['ended'] = null;

  // The rescore belongs here: reassess reports the chart's current scale, so an assessment taken
  // before the correction would otherwise stay fresh and be handed over with the old number.
  private clinicalState() { return JSON.stringify([this.colleagueAsked, this.reviewArrived, this.rescoredAt !== null]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): OxygenTargetScaleEvent[] {
    if (this.ended) return [];
    const terminal = this.confirmationAt === null ? OXYGEN_TARGET_TAKEOVER_TICKS : OXYGEN_TARGET_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: OxygenTargetScaleEvent[] = [];
    if (!this.colleagueAsked && until >= OXYGEN_TARGET_COLLEAGUE_TICKS) {
      this.change(() => { this.colleagueAsked = true; });
      events.push({ id: 'colleague-asked', message: 'A colleague reads the score of 3 off the chart and asks whether they should put some oxygen on her to bring the saturation up. This is the harm the guideline names, and it arrives as a helpful offer rather than as a mistake: the chart said a number was wrong, and the obvious way to fix a saturation is to raise it.' });
    }
    // The team reviews when the scale decision is taken to them, and not otherwise.
    if (!this.reviewArrived && this.confirmationAt !== null
      && until >= this.confirmationAt + OXYGEN_TARGET_REVIEW_TICKS) {
      this.change(() => { this.reviewArrived = true; });
      events.push({ id: 'review-arrived', message: 'The qualified team reviews. They confirm the documented decision to use the second scale, confirm the prescribed range, and record that the chart in use was the wrong one and that the section not being used should have been crossed out. They also record that a score of 0 on the correct scale is not a statement that she is well.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the prescribed range, the scale the chart was scored on, and what changed when the score was recalculated. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): OxygenTargetScaleEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    const charted = oxygenTargetScore(1, SATURATION_PERCENT, ON_SUPPLEMENTAL_OXYGEN);
    const prescribed = oxygenTargetScore(2, SATURATION_PERCENT, ON_SUPPLEMENTAL_OXYGEN);
    switch (action) {
      case 'check-the-prescription':
        this.prescriptionCheckedAt ??= tick;
        this.prescriptionRecord = { atTick: tick, prescribedTargetRange: PRESCRIBED_TARGET_RANGE,
          prescribedScale: 2, scaleDecisionDocumented: true };
        return emit('prescription-check', `Requested prescription: the target saturation range prescribed for her is ${PRESCRIBED_TARGET_RANGE}, and the decision to score her on the second scale is documented in the notes by the respiratory review two days ago, alongside the blood gas that confirmed hypercapnic respiratory failure. Both are required before the second scale may be used, and both are present. This partial check reads no observation chart.`);
      case 'check-the-chart': {
        this.chartCheckedAt ??= tick;
        const corrected = this.rescoredAt !== null;
        this.chartRecord = { atTick: tick, chartedScale: corrected ? 2 : 1,
          chartedScore: corrected ? prescribed : charted,
          saturationPercent: SATURATION_PERCENT, onSupplementalOxygen: ON_SUPPLEMENTAL_OXYGEN };
        return emit('chart-check', `Requested chart: the observation in front of you is ${SATURATION_PERCENT}% breathing air, scored on the ${corrected ? 'second' : 'first'} scale, giving ${corrected ? prescribed : charted} points for the saturation. ${corrected ? 'The section not in use is crossed out.' : 'The second-scale section of the chart has not been crossed out and has not been used.'} This partial check reads no prescription.`);
      }
      case 'record-the-scale-mismatch':
        if (this.prescriptionCheckedAt === null || this.chartCheckedAt === null) {
          return emit('mismatch-refused', 'A mismatch is a statement about two documents, and only one of them has been read. Read both the prescription and the chart before recording that they disagree.');
        }
        if (this.mismatchRecordedAt !== null) return events;
        this.mismatchRecordedAt = tick;
        return emit('mismatch-recorded', `Recorded: the prescribed range is ${PRESCRIBED_TARGET_RANGE} on the second scale, the chart is scored on the first, and the two have been running side by side since admission. The recording is about the chart, not about her: nothing here says her saturation was measured wrongly or that anybody entered a number they should not have.`);
      case 'rescore-on-the-prescribed-scale':
        if (this.mismatchRecordedAt === null) {
          return emit('rescore-refused', 'Nothing has been recorded as mismatched yet. Rescoring before the mismatch is recorded replaces one number with another and leaves no trace of why.');
        }
        if (this.rescoredAt !== null) return events;
        this.change(() => { this.rescoredAt = tick; });
        return emit('rescored', `Rescored on the prescribed scale: ${SATURATION_PERCENT}% breathing air scores ${prescribed} rather than ${charted}, because ${PRESCRIBED_TARGET_RANGE} is where she is meant to be and the first scale scores anything below 96% as a deviation from a target she was never given. The saturation did not move. The score fell by ${charted - prescribed} because it is now being compared with the range somebody prescribed for her.`);
      case 'record-what-the-rescore-changes':
        if (this.rescoredAt === null) {
          return emit('consequences-refused', 'There is no recalculated score yet, so there is nothing whose consequences can be stated.');
        }
        if (this.consequencesRecordedAt !== null) return events;
        this.consequencesRecordedAt = tick;
        return emit('consequences-recorded', 'Recorded: what changed is the score and nothing else. She is the same, the saturation is the same, and the observation frequency stays where the prescribed scale and her condition put it rather than where the old number put it. What the corrected score removes is a reason to give her oxygen she does not need. What it does not supply is evidence that she is well, and a lower number must not be read as an improvement she did not make.');
      case 'confirm-the-scale-with-the-team':
        if (this.mismatchRecordedAt === null || this.rescoredAt === null) {
          return emit('confirmation-refused', 'There is nothing to take to them yet. A confirmation request carries the recorded mismatch and the recalculated score; without those it is a question about which chart to use rather than a finding about this patient, and the answer comes back as an opinion instead of a decision.');
        }
        if (this.confirmationAt !== null) return events;
        this.confirmationAt = tick;
        return emit('confirmation-requested', 'The documented decision and the prescribed range are taken to the qualified team for confirmation, with the mismatch and the recalculated score attached. Changing which scale a patient is scored on is a clinical decision that belongs to a competent clinical decision maker and is recorded in the notes; a nurse who finds the chart on the wrong one takes it to be confirmed rather than switching it alone.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', `Supplied boundaries. The second scale exists for patients with hypercapnic respiratory failure confirmed on blood gas who are prescribed a lower target range, and the guideline that publishes it warns in terms that a patient inside ${PRESCRIBED_TARGET_RANGE} scores points on the ordinary scale and that this may prompt staff to raise the inspired oxygen to reach a normal-looking figure and put her at risk. One trial in exacerbations of this disease, randomised by paramedic rather than by patient, found lower mortality with a titrated oxygen strategy than with routine high-flow oxygen; more than a third of the confirmed cases received treatment off protocol, and the difference did not reach significance among those who received what they were allocated. The guideline states plainly that it is nevertheless not known whether ${PRESCRIBED_TARGET_RANGE} is the ideal range. The second scale itself has not been shown to detect deterioration better than the first: the one study to compare them found no improvement in discrimination. A corrected score is a corrected score and not a reassurance.`);
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', `Observation continues at the frequency her condition calls for${this.rescoredAt === null ? ', on the chart as it currently stands' : ', recorded on the prescribed scale with the unused section crossed out so the next person cannot score her on it by accident'}. The saturation is recorded with whether she was breathing air, because on the prescribed scale the same number means different things with and without oxygen.`);
      case 'reassess': {
        this.prescriptionRecord = { atTick: tick, prescribedTargetRange: PRESCRIBED_TARGET_RANGE,
          prescribedScale: 2, scaleDecisionDocumented: true };
        this.chartRecord = { atTick: tick, chartedScale: this.rescoredAt === null ? 1 : 2,
          chartedScore: this.rescoredAt === null ? charted : prescribed,
          saturationPercent: SATURATION_PERCENT, onSupplementalOxygen: ON_SUPPLEMENTAL_OXYGEN };
        this.observation = { ...this.prescriptionRecord, ...this.chartRecord };
        this.observedPhase = this.phase;
        if (this.reviewArrived) this.reviewObserved = true;
        const view = this.observation;
        return emit(this.reviewArrived ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: saturation ${view.saturationPercent}% ${view.onSupplementalOxygen ? 'on oxygen' : 'breathing air'}, unchanged; prescribed range ${view.prescribedTargetRange} on scale ${view.prescribedScale}; the chart in front of you is scored on scale ${view.chartedScale}, giving ${view.chartedScore}. ${this.colleagueAsked ? 'A colleague has already offered to put oxygen on her because of the number. ' : ''}${this.reviewArrived ? 'The qualified team has confirmed the documented decision and recorded that the wrong chart was in use.' : 'No confirmation has come back yet.'} No diagnosis, cause, or outcome is established here.`);
      }
      case 'raise-the-oxygen-to-correct-it':
        this.oxygenRaiseAttempted = true;
        return emit('oxygen-raise-refused', `Raising the inspired oxygen to bring the saturation up was refused, and no oxygen was selected, set, or delivered. She is inside her prescribed range at ${SATURATION_PERCENT}% on air. The guideline names this exact sequence — a patient at target scoring points on the ordinary scale, and staff raising the oxygen to reach a normal-looking number — as a way to put her at risk. Oxygen selection is not a nursing correction to a scoring error, and the score is what is wrong here.`);
      case 'assume-the-diagnosis-sets-the-scale':
        this.scaleAssumed = true;
        return emit('assumed-scale-refused', 'Switching to the second scale because she has the diagnosis was refused. The scale does not follow from a diagnosis: it requires hypercapnic respiratory failure confirmed on blood gas, a prescribed lower target range, and a decision recorded in the notes by a competent clinical decision maker. Most patients with this diagnosis do not meet that. Here all three happen to exist, which is why the answer is to go and read them rather than to assume them.');
      case 'a-lower-score-means-she-is-improving':
        this.lowerScoreReadAsWell = true;
        return emit('improvement-refused', 'Reading the corrected score as an improvement was refused. Nothing about her changed in that minute; a measurement was compared with the right range instead of the wrong one. The second scale has not been shown to detect deterioration better than the first, so a 0 on it excludes less than a low score usually feels like it excludes.');
      case 'score-both-and-take-the-higher':
        this.higherOfBothTaken = true;
        return emit('both-scales-refused', 'Scoring both scales and carrying the higher number was refused. It looks cautious and it is not: it keeps the number that is comparing her with a range nobody prescribed, and it hands the next reader a total they cannot reproduce from either published scale. The chart carries one scale, and the guideline asks for the unused section to be crossed out for exactly this reason.');
      case 'handoff':
        if (this.prescriptionCheckedAt === null || this.chartCheckedAt === null || this.mismatchRecordedAt === null
          || this.rescoredAt === null || this.consequencesRecordedAt === null || this.confirmationAt === null
          || this.boundariesAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Read the prescription and the chart, record that they disagree, rescore on the prescribed scale, state what the rescore does and does not change, take the documented decision to the qualified team, review the boundaries, arrange observation on the corrected chart, and take a current full assessment. A confirmed cause and a settled trajectory are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the prescription, the scale decision, oxygen, and every treatment decision. What travels is the prescribed range of ${PRESCRIBED_TARGET_RANGE} on the second scale with its documented decision, that the chart had been scored on the first, that the saturation of ${SATURATION_PERCENT}% on air did not change when the score fell from ${charted} to ${prescribed}, and that the corrected score removes a reason to give oxygen rather than supplying evidence that she is well. ${this.reviewObserved ? 'The qualified team recorded the same distinction. ' : ''}Practice ends, not care, and no cause, trajectory, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional scoring lesson. No care was started.');
    }
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Held still on purpose. A saturation that drifted would let a learner treat the drift as the
    // answer, when the whole lesson is that the number was right and the comparison was wrong.
    return { heartRateBpm: 84, systolicMmHg: 128, diastolicMmHg: 74, meanArterialMmHg: 92,
      respiratoryRateBpm: 18, spo2Percent: SATURATION_PERCENT, coreTemperatureC: 36.8,
      alertness: 'awake, alert, speaking in full sentences, breathing air' };
  }

  snapshot(_tick: number): OxygenTargetScaleSnapshot {
    const charted = oxygenTargetScore(1, SATURATION_PERCENT, ON_SUPPLEMENTAL_OXYGEN);
    const prescribed = oxygenTargetScore(2, SATURATION_PERCENT, ON_SUPPLEMENTAL_OXYGEN);
    return {
      prescriptionCheckedAtTick: this.prescriptionCheckedAt,
      chartCheckedAtTick: this.chartCheckedAt,
      mismatchRecordedAtTick: this.mismatchRecordedAt,
      rescoredAtTick: this.rescoredAt,
      consequencesRecordedAtTick: this.consequencesRecordedAt,
      confirmationAtTick: this.confirmationAt,
      boundariesReviewedAtTick: this.boundariesAt,
      monitoringAtTick: this.monitoringAt,
      saturationPercent: SATURATION_PERCENT,
      onSupplementalOxygen: ON_SUPPLEMENTAL_OXYGEN,
      prescribedTargetRange: PRESCRIBED_TARGET_RANGE,
      chartedScale: this.rescoredAt === null ? 1 : 2,
      prescribedScale: 2,
      scaleDecisionDocumented: true,
      chartedScore: this.rescoredAt === null ? charted : prescribed,
      prescribedScaleScore: prescribed,
      colleagueAskedToRaiseOxygen: this.colleagueAsked,
      reviewArrived: this.reviewArrived,
      reviewObserved: this.reviewObserved,
      oxygenRaiseAttempted: this.oxygenRaiseAttempted,
      scaleAssumedFromDiagnosis: this.scaleAssumed,
      lowerScoreReadAsWell: this.lowerScoreReadAsWell,
      higherOfBothScoresTaken: this.higherOfBothTaken,
      prescriptionRecord: this.prescriptionRecord ? { ...this.prescriptionRecord } : null,
      chartRecord: this.chartRecord ? { ...this.chartRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
