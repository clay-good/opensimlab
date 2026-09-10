import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalPhosphateTargetSnapshot } from '@platform/kernel/protocol';
export type { RenalPhosphateTargetSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not kinetics, safe waits, or grading deadlines.
export const RENAL_PHOSPHATE_RECORDS_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_PHOSPHATE_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const RENAL_PHOSPHATE_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_PHOSPHATE_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const RENAL_PHOSPHATE_ACTIONS = ['review-surrogate', 'review-trial', 'review-intake',
  'own-decision', 'call-support', 'monitor', 'check-phosphate', 'check-nutrition',
  'reassess', 'handoff', 'treat-the-number', 'restrict-further'] as const;
export type RenalPhosphateAction = typeof RENAL_PHOSPHATE_ACTIONS[number];
export interface RenalPhosphateEvent { readonly id: string; readonly message: string }

export function supportsRenalPhosphateTarget(scenario: Scenario): boolean {
  return scenario.metadata.id === 'phosphate-target-a-surrogate-that-moved-the-wrong-way'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-phosphate').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-phosphate-boundary').length === 1;
}

/**
 * The phosphate does not move, because nothing here is a treatment.
 *
 * A learner who reviews well is not rewarded with a value inside the range; there is no
 * treatment in this lesson to produce one. What the review changes is the record: the old
 * clinic letters arrive, and they carry the weight and albumin trend that the phosphate column
 * never showed.
 */
export class RenalPhosphateTarget {
  private surrogateAt: number | null = null;
  private trialAt: number | null = null;
  private intakeAt: number | null = null;
  private decisionAt: number | null = null;
  private supportAt: number | null = null;
  private monitoringAt: number | null = null;
  private recordsOpened = false;
  private unexamined = false;
  private treatAttempted = false;
  private restrictAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private phosphateObservation: RenalPhosphateTargetSnapshot['phosphateObservation'] = null;
  private nutritionObservation: RenalPhosphateTargetSnapshot['nutritionObservation'] = null;
  private observation: RenalPhosphateTargetSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RenalPhosphateTargetSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.recordsOpened, this.decisionAt !== null, this.unexamined]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): RenalPhosphateEvent[] {
    if (this.ended) return [];
    const terminal = this.surrogateAt === null && this.intakeAt === null
      ? RENAL_PHOSPHATE_TAKEOVER_TICKS : RENAL_PHOSPHATE_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: RenalPhosphateEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.unexamined && this.surrogateAt === null && until >= RENAL_PHOSPHATE_DELAY_TICKS) {
      due.push({ at: RENAL_PHOSPHATE_DELAY_TICKS, apply: () => {
        this.change(() => { this.unexamined = true; });
        events.push({ id: 'unexamined-contrast', message: 'The protocol target still stands unexamined in this authored contrast, and the plan is still to treat the number into the range. Ask what the range is standing in for. The teaching clock is not a safe waiting period, a deterioration prediction, or a grading cutoff.' });
      } });
    }
    if (this.intakeAt !== null && !this.recordsOpened && until >= this.intakeAt + RENAL_PHOSPHATE_RECORDS_TICKS) {
      due.push({ at: this.intakeAt + RENAL_PHOSPHATE_RECORDS_TICKS, apply: () => {
        this.change(() => { this.recordsOpened = true; });
        events.push({ id: 'records-checkpoint', message: 'The previous clinic letters are now to hand. Request the current findings together. They record what was restricted and when; they establish no cause for the weight and albumin change, and they contain no vascular imaging or bone assessment.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review what the target stands for, the randomised comparison in this population, what he is actually eating, and who owns the decision. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalPhosphateEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'review-surrogate':
        if (this.surrogateAt !== null) return events;
        this.surrogateAt = tick;
        return emit('surrogate-review', 'Recorded: the clinic target is a serum value standing in for vascular and bone outcomes that nobody in this room can see, and that this rehearsal never supplies. Moving the value is not the same as moving what it stands for. This says nothing about whether his phosphate is harmless; it says the number is not the thing.');
      case 'review-trial':
        if (this.trialAt !== null) return events;
        this.trialAt = tick;
        return emit('trial-review', 'Recorded: in 148 patients with an estimated GFR of 20 to 45 randomised to calcium acetate, lanthanum, sevelamer, or placebo, serum and urinary phosphorus fell and secondary hyperparathyroidism was attenuated — and coronary and abdominal aortic calcification increased significantly against placebo. The authors concluded that the safety and efficacy of phosphate binders in CKD remain uncertain. That is uncertainty in both directions, in one trial of 148 patients over nine months, where the calcification findings were secondary.');
      case 'review-intake':
        if (this.intakeAt !== null) return events;
        this.intakeAt = tick;
        return emit('intake-review', 'Reviewed with qualified support: the diet has already been restricted twice, appetite has been poor for four months, and the difference between protein-bound phosphate and the additive phosphate in processed food and drinks has not been discussed with him. What he is actually eating is not in any of the numbers on the screen. No diet, target, or education programme is prescribed here.');
      case 'own-decision':
        if (this.decisionAt !== null) return events;
        this.change(() => { this.decisionAt = tick; });
        return emit('decision-owned', 'The binder decision is placed explicitly with the qualified team that knows his clinical context, the costs, and his tolerability — which is where the comparative evidence leaves it, because the comparison between binder classes for patient-level outcomes has not been settled. This lesson selects no binder, no dose, and no target, and does not decide whether one should be started.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified renal, dietetic, pharmacy, and nursing teams share the decision, the intake review, and continuing surveillance. Care does not wait for support acknowledgment.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Arrange continuing biochemical and nutritional review, and record the weight and albumin trend as an open question with no cause established. A repeated phosphate restates the surrogate rather than answering it.');
      case 'check-phosphate':
        this.phosphateObservation = this.phosphateFinding(tick);
        return emit('phosphate-check', `Requested fictional phosphate: ${this.phosphateObservation.phosphateMmolL.toFixed(2)} mmol/L. It has not changed, because nothing in this rehearsal is a treatment. This partial result supplies no weight, albumin, imaging, or bone assessment.`);
      case 'check-nutrition':
        this.nutritionObservation = this.nutritionFinding(tick);
        return emit('nutrition-check', `Requested fictional nutritional findings: weight ${this.nutritionObservation.weightKg} kg, albumin ${this.nutritionObservation.albuminGL} g/L. ${this.recordsOpened ? 'The previous clinic letters are open beside them.' : 'The previous clinic letters have not been retrieved.'} These are findings, not a diagnosis of malnutrition.`);
      case 'reassess':
        this.phosphateObservation = this.phosphateFinding(tick);
        this.nutritionObservation = this.nutritionFinding(tick);
        this.observation = { ...this.phosphateFinding(tick), ...this.nutritionFinding(tick),
          parathyroidPmolL: 31, restrictionsApplied: this.recordsOpened ? 2 : 0, ...this.vitals() };
        this.observedPhase = this.phase;
        return emit(this.recordsOpened ? 'records-reassessment' : this.unexamined ? 'unexamined-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: phosphate ${this.observation.phosphateMmolL.toFixed(2)} mmol/L; weight ${this.observation.weightKg} kg; albumin ${this.observation.albuminGL} g/L; parathyroid hormone ${this.observation.parathyroidPmolL} pmol/L; ${this.observation.restrictionsApplied} dietary restrictions documented in the retrieved letters. HR ${this.observation.heartRateBpm}/min, BP ${this.observation.systolicMmHg}/${this.observation.diastolicMmHg} mmHg, ${this.observation.alertness}. The phosphate is where it was. The weight and the albumin are the findings that moved, and no cause for either is established. No vascular imaging, bone assessment, or outcome is available.`);
      case 'treat-the-number':
        this.treatAttempted = true;
        return emit('treat-the-number-refused', 'Starting a binder in order to bring the value into the printed range, with the range as the goal, was refused. The range is a surrogate, and the one randomised comparison in this population lowered it while calcification rose. This refusal is not a claim that a binder would harm him, does not establish that his phosphate is safe, and does not decide against starting one — it declines to make the number the reason.');
      case 'restrict-further':
        this.restrictAttempted = true;
        return emit('restrict-further-refused', 'Tightening the diet a third time without reviewing what he is eating and how he is doing on it was refused. His appetite has been poor for four months, he has lost 6 kg, and his albumin has fallen 7 g/L. That is not a diagnosis of malnutrition and it is not proof the restrictions caused it; it is a reason to look before restricting again. No diet is prescribed here either way.');
      case 'handoff':
        if (this.surrogateAt === null || this.trialAt === null || this.intakeAt === null
          || this.decisionAt === null || this.supportAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase || !this.recordsOpened) {
          return emit('handoff-refused', 'Record the target named as a surrogate, the randomised comparison including the calcification finding, the intake and nutritional review, the owned binder decision, support, monitoring, and a current full assessment once the previous letters are open. A phosphate inside the printed range is not a handoff gate and is not available.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns the binder decision with the context the number does not carry: a target that is a surrogate, a randomised comparison that lowered it while calcification rose, two restrictions already applied, and 6 kg and 7 g/L of albumin gone with no cause established. Practice ends, not care, and no target, outcome, cause, or discharge readiness is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional phosphate-target lesson. No care was started.');
    }
  }

  // The surrogate is inert: there is no treatment here, so there is nothing for it to respond to.
  private phosphateFinding(tick: number) { return { atTick: tick, phosphateMmolL: 1.62 }; }
  private nutritionFinding(tick: number) { return { atTick: tick, weightKg: 68, albuminGL: 31 }; }
  rhythm(): 'sinus' { return 'sinus'; }
  vitals() {
    return { heartRateBpm: 74, systolicMmHg: 138, diastolicMmHg: 76, meanArterialMmHg: 90,
      respiratoryRateBpm: 15, spo2Percent: 97, coreTemperatureC: 36.6,
      alertness: 'awake, oriented, and thinner than at his last visit' };
  }
  snapshot(tick: number): RenalPhosphateTargetSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return { supportActive: this.supportAt !== null, surrogateReviewedAtTick: this.surrogateAt,
      trialReviewedAtTick: this.trialAt, intakeReviewedAtTick: this.intakeAt,
      decisionOwnedAtTick: this.decisionAt, monitoringAtTick: this.monitoringAt,
      recordsDueInSeconds: !this.ended && this.intakeAt !== null && !this.recordsOpened
        ? remaining(this.intakeAt, RENAL_PHOSPHATE_RECORDS_TICKS) : null,
      recordsOpened: this.recordsOpened, unexaminedContrastObserved: this.unexamined,
      treatTheNumberAttempted: this.treatAttempted, restrictFurtherAttempted: this.restrictAttempted,
      phosphateObservation: this.phosphateObservation ? { ...this.phosphateObservation } : null,
      nutritionObservation: this.nutritionObservation ? { ...this.nutritionObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
