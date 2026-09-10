import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RenalContrastAttributionSnapshot } from '@platform/kernel/protocol';
export type { RenalContrastAttributionSnapshot } from '@platform/kernel/protocol';

// Fictional assessment checkpoints, not kinetics, safe waits, or grading deadlines.
export const RENAL_CONTRAST_RECORD_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RENAL_CONTRAST_DELAY_TICKS = 5 * 60 * TICKS_PER_SECOND;
export const RENAL_CONTRAST_TAKEOVER_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const RENAL_CONTRAST_SESSION_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const RENAL_CONTRAST_ACTIONS = ['review-label', 'review-alternatives', 'review-evidence',
  'withdraw-exposures', 'call-support', 'monitor', 'check-creatinine', 'check-perfusion',
  'reassess', 'handoff', 'attribute-to-contrast', 'stop-looking'] as const;
export type RenalContrastAction = typeof RENAL_CONTRAST_ACTIONS[number];
export interface RenalContrastEvent { readonly id: string; readonly message: string }

export function supportsRenalContrastAttribution(scenario: Scenario): boolean {
  return scenario.metadata.id === 'contrast-attribution-a-label-that-stopped-the-search'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'renal-contrast').length === 1
    && scenario.timeline.filter((event) => event.target === 'renal-contrast-boundary').length === 1;
}

/**
 * Nothing the learner does bends the creatinine, and that is deliberate.
 *
 * A lesson about attribution cannot also reward the right answer with a better number, because
 * a number that improves when you reason well teaches that reasoning well is how numbers
 * improve. What the search changes here is the record: reviewing the alternatives opens the
 * ward observation chart and the drug chart, which is where the competing explanations were
 * sitting the whole time. The creatinine keeps rising either way.
 */
export class RenalContrastAttribution {
  private labelAt: number | null = null;
  private alternativesAt: number | null = null;
  private evidenceAt: number | null = null;
  private withdrawnAt: number | null = null;
  private supportAt: number | null = null;
  private monitoringAt: number | null = null;
  private recordOpened = false;
  private unexamined = false;
  private attributionAttempted = false;
  private stopLookingAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private creatinineObservation: RenalContrastAttributionSnapshot['creatinineObservation'] = null;
  private perfusionObservation: RenalContrastAttributionSnapshot['perfusionObservation'] = null;
  private observation: RenalContrastAttributionSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RenalContrastAttributionSnapshot['ended'] = null;

  private clinicalState() { return JSON.stringify([this.recordOpened, this.withdrawnAt !== null, this.unexamined]); }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): RenalContrastEvent[] {
    if (this.ended) return [];
    const terminal = this.labelAt === null && this.alternativesAt === null
      ? RENAL_CONTRAST_TAKEOVER_TICKS : RENAL_CONTRAST_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: RenalContrastEvent[] = [];
    const due: { at: number; apply: () => void }[] = [];
    if (!this.unexamined && this.alternativesAt === null && until >= RENAL_CONTRAST_DELAY_TICKS) {
      due.push({ at: RENAL_CONTRAST_DELAY_TICKS, apply: () => {
        this.change(() => { this.unexamined = true; });
        events.push({ id: 'unexamined-contrast', message: 'The written attribution still stands unexamined in this authored contrast, and the nephrotoxic exposures are still running. Review what the label did not exclude. The teaching clock is not a safe waiting period, a deterioration prediction, or a grading cutoff.' });
      } });
    }
    if (this.alternativesAt !== null && !this.recordOpened && until >= this.alternativesAt + RENAL_CONTRAST_RECORD_TICKS) {
      due.push({ at: this.alternativesAt + RENAL_CONTRAST_RECORD_TICKS, apply: () => {
        this.change(() => { this.recordOpened = true; });
        events.push({ id: 'record-checkpoint', message: 'The full ward observation chart and drug chart are now to hand. Request the current findings together. These records were available from the start; opening them establishes what else was happening, not what caused the injury.' });
      } });
    }
    for (const checkpoint of due.sort((a, b) => a.at - b.at)) checkpoint.apply();
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the written attribution, the explanations it left untouched, what a rise after an exposure does and does not show, and continuing ownership. This authored stop predicts neither injury nor a safe delay.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RenalContrastEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'review-label':
        if (this.labelAt !== null) return events;
        this.labelAt = tick;
        return emit('label-review', 'Recorded: "contrast-induced nephropathy" appears in the ward notes as an attribution someone wrote, not as a result that was reported. No laboratory result, imaging report, biopsy, or nephrology opinion says it. The timing of the rise is compatible with it and with several other things, which is why timing alone attributes nothing.');
      case 'review-alternatives':
        if (this.alternativesAt !== null) return events;
        this.alternativesAt = tick;
        return emit('alternatives-review', 'Reviewed with qualified support: two recorded ward episodes with a systolic pressure below 90 mmHg, a renin-angiotensin blocker continued throughout, three days of a non-steroidal anti-inflammatory, and a fever of 38.4°C with C-reactive protein rising from 22 to 141 mg/L with no source supplied. The label excluded none of these. Naming them does not make any of them the cause either.');
      case 'review-evidence':
        if (this.evidenceAt !== null) return events;
        this.evidenceAt = tick;
        return emit('evidence-review', 'Reviewed: a creatinine that rises after an exposure attributes nothing without a comparison group, and controlled work that compared contrast-enhanced, unenhanced and unscanned patients with propensity matching did not find the association the label assumes. That work is single-centre and retrospective, and the sickest patients are the least likely to have been given contrast, so it is evidence against a strong causal claim rather than proof of none. A consensus statement calling the risk overstated is a position that is discussed, not a settled fact.');
      case 'withdraw-exposures':
        if (this.withdrawnAt !== null) return events;
        this.change(() => { this.withdrawnAt = tick; });
        return emit('exposures-withdrawn', 'The continuing non-steroidal anti-inflammatory and the renin-angiotensin blocker are reviewed with the responsible team and stopped for now, and the decision is recorded. Withdrawing a contributor that is still running is not an attribution, and it does not treat the injury or establish what started it.');
      case 'call-support':
        if (this.supportAt !== null) return events;
        this.supportAt = tick;
        return emit('support', 'Qualified renal, ward, pharmacy, and nursing teams share the open question, the withdrawn exposures, and continuing surveillance. Care does not wait for support acknowledgment, and a nephrology opinion is not a prerequisite for reading the chart.');
      case 'monitor':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring', 'Continue serial creatinine, urine output, perfusion, and inflammatory review, and keep the source question open. A creatinine-only result or a perfusion-only check is useful but does not refresh the full picture.');
      case 'check-creatinine':
        this.creatinineObservation = this.creatinineFinding(tick);
        return emit('creatinine-check', `Requested fictional creatinine: ${this.creatinineObservation.creatinineUmolL} µmol/L. This partial result supplies no perfusion record, drug chart, or inflammatory trend, and its direction does not identify a cause.`);
      case 'check-perfusion':
        this.perfusionObservation = this.perfusionFinding(tick);
        return emit('perfusion-check', `Requested observation record: ${this.perfusionObservation.episodes} recorded episodes with a systolic pressure below 90 mmHg, lowest ${this.perfusionObservation.lowestSystolicMmHg} mmHg. ${this.recordOpened ? 'The full chart is open.' : 'Only the summary is to hand; the full chart has not been opened yet.'} This partial record supplies no creatinine or inflammatory trend.`);
      case 'reassess':
        this.creatinineObservation = this.creatinineFinding(tick);
        this.perfusionObservation = this.perfusionFinding(tick);
        this.observation = { ...this.creatinineFinding(tick), ...this.perfusionFinding(tick),
          cReactiveProteinMgL: 141, nephrotoxinsRunning: this.withdrawnAt === null ? 2 : 0, ...this.vitals() };
        this.observedPhase = this.phase;
        return emit(this.recordOpened ? 'record-reassessment' : this.unexamined ? 'unexamined-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: creatinine ${this.observation.creatinineUmolL} µmol/L; ${this.observation.episodes} recorded episodes below a systolic 90 mmHg, lowest ${this.observation.lowestSystolicMmHg} mmHg; C-reactive protein ${this.observation.cReactiveProteinMgL} mg/L; ${this.observation.nephrotoxinsRunning} nephrotoxic exposures still running. HR ${this.observation.heartRateBpm}/min, BP ${this.observation.systolicMmHg}/${this.observation.diastolicMmHg} mmHg, temperature ${this.observation.coreTemperatureC}°C, ${this.observation.alertness}. The creatinine is still rising. That does not confirm the label, and a fall would not have confirmed it either.`);
      case 'attribute-to-contrast':
        this.attributionAttempted = true;
        return emit('attribution-refused', 'Recording the injury as caused by contrast was refused. Nothing here reports that: the timing is shared by every other exposure on the same days, and a rise after an exposure identifies no cause without a comparison group. This refusal is not a claim that contrast never injures a kidney, and it does not name a different cause.');
      case 'stop-looking':
        this.stopLookingAttempted = true;
        return emit('stop-looking-refused', 'Closing the search on the strength of the written label was refused. The hypotension, the two nephrotoxic drugs, and the fever with a rising inflammatory marker are all still open, and closing the question is what the label did in the notes three days ago.');
      case 'handoff':
        if (this.labelAt === null || this.alternativesAt === null || this.evidenceAt === null
          || this.withdrawnAt === null || this.supportAt === null || this.monitoringAt === null
          || this.observation === null || this.observedPhase !== this.phase || !this.recordOpened) {
          return emit('handoff-refused', 'Record the reading of the written label, the explanations it did not exclude, the evidence review, the withdrawn exposures, support ownership, monitoring, and a current full assessment once the full charts are open. Naming a cause before leaving, a falling creatinine, and a completed diagnosis are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', 'The receiving team owns an open question: the cause is unresolved and recorded as unresolved, the nephrotoxic exposures are withdrawn, the hypotension and the fever are still being worked up, and the note that said "contrast-induced nephropathy" has been marked as an attribution rather than a finding. Practice ends, not the search, and no cause, recovery, or discharge readiness is certified.');
      default:
        return emit('action-refused', 'That choice is not part of this fictional contrast-attribution lesson. No care was started.');
    }
  }

  // Authored and monotonic: the number is not a scoreboard, so it does not reward the search.
  private creatinineFinding(tick: number) {
    return { atTick: tick, creatinineUmolL: this.recordOpened ? 191 : 168 };
  }
  private perfusionFinding(tick: number) {
    return { atTick: tick, lowestSystolicMmHg: this.recordOpened ? 78 : 88, episodes: this.recordOpened ? 4 : 2 };
  }
  rhythm(): 'sinus' { return 'sinus'; }
  vitals() {
    return { heartRateBpm: 92, systolicMmHg: 108, diastolicMmHg: 62, meanArterialMmHg: 74,
      respiratoryRateBpm: 18, spo2Percent: 96, coreTemperatureC: 37.8,
      alertness: 'awake, oriented, and comfortable' };
  }
  snapshot(tick: number): RenalContrastAttributionSnapshot {
    const remaining = (at: number, duration: number) => Math.max(0, Math.ceil((at + duration - tick) / TICKS_PER_SECOND));
    return { supportActive: this.supportAt !== null, labelReviewedAtTick: this.labelAt,
      alternativesReviewedAtTick: this.alternativesAt, evidenceReviewedAtTick: this.evidenceAt,
      exposuresWithdrawnAtTick: this.withdrawnAt, monitoringAtTick: this.monitoringAt,
      recordDueInSeconds: !this.ended && this.alternativesAt !== null && !this.recordOpened
        ? remaining(this.alternativesAt, RENAL_CONTRAST_RECORD_TICKS) : null,
      recordOpened: this.recordOpened, unexaminedContrastObserved: this.unexamined,
      attributionClaimAttempted: this.attributionAttempted, stopLookingAttempted: this.stopLookingAttempted,
      creatinineObservation: this.creatinineObservation ? { ...this.creatinineObservation } : null,
      perfusionObservation: this.perfusionObservation ? { ...this.perfusionObservation } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false };
  }
}
