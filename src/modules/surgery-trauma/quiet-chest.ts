import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { QuietChestSnapshot } from '@platform/kernel/protocol';
export type { QuietChestSnapshot } from '@platform/kernel/protocol';

/**
 * An injury whose severity is not visible on the day it is assessed.
 *
 * Four broken ribs in an 81-year-old are not four broken ribs in a 30-year-old, and the
 * difference does not show up in anything measured at the bedside on the first evening. The
 * numbers are normal, the film shows no pneumothorax, and she is comfortable lying still. What
 * predicts the next three days is the count and her age, and neither of those is a finding
 * anybody is going to notice happening.
 *
 * It is the module's third lesson about holding a position, and the hardest of them, because
 * nothing arrives at all. In `negative-scan` an investigation has already failed to exclude
 * something; in `unfinished-survey` a sedation window eventually shows what the record could
 * not. Here the only thing that ever changes is a telephone call from a daughter who cannot
 * stay the night, which alters nothing physiological and the entire plan.
 */
export const QUIET_CHEST_FAMILY_TICKS = 15 * 60 * TICKS_PER_SECOND;
export const QUIET_CHEST_TEAM_TICKS = 30 * 60 * TICKS_PER_SECOND;
export const QUIET_CHEST_TAKEOVER_TICKS = 120 * 60 * TICKS_PER_SECOND;
export const QUIET_CHEST_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const QUIET_CHEST_ACTIONS = ['record-the-fall-and-what-was-broken',
  'record-what-comfortable-at-rest-measures', 'record-what-the-count-predicts',
  'escalate-to-the-admitting-team', 'record-bounded-admission-intent', 'review-boundaries',
  'check-observations', 'check-chest-record', 'reassess', 'handoff',
  'her-numbers-are-normal-so-she-can-go-home', 'there-is-no-pneumothorax-on-the-film',
  'she-says-the-pain-is-manageable', 'send-her-home-with-tablets-and-review-in-a-week'] as const;
export type QuietChestAction = typeof QUIET_CHEST_ACTIONS[number];
export interface QuietChestEvent { readonly id: string; readonly message: string }

export function supportsQuietChest(scenario: Scenario): boolean {
  return scenario.metadata.id === 'quiet-chest-an-injury-whose-severity-is-not-yet-visible'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'quiet-chest').length === 1
    && scenario.timeline.filter((event) => event.target === 'quiet-chest-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'quiet-chest-boundary').length === 1;
}

export class QuietChest {
  private injuryAt: number | null = null;
  private comfortLimitsAt: number | null = null;
  private countAt: number | null = null;
  private escalationAt: number | null = null;
  private admissionIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private familyCalled = false;
  private teamResponded = false;
  private teamObserved = false;
  private normalNumbersAttempted = false;
  private filmClaimAttempted = false;
  private painReportAttempted = false;
  private dischargeAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: QuietChestSnapshot['observationRecord'] = null;
  private chestRecord: QuietChestSnapshot['chestRecord'] = null;
  private observation: QuietChestSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: QuietChestSnapshot['ended'] = null;

  /**
   * Nothing measured ever moves, so the freshness gate can only track the two things that do:
   * the hours since the fall, and whether anybody has yet been told she will be alone.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.hoursSinceFall(), this.familyCalled, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): QuietChestEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? QUIET_CHEST_TAKEOVER_TICKS : QUIET_CHEST_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: QuietChestEvent[] = [];
    if (!this.familyCalled && until >= QUIET_CHEST_FAMILY_TICKS) {
      this.change(() => { this.familyCalled = true; });
      events.push({ id: 'family-called', message: 'Her daughter telephones. She had assumed she could stay tonight and she cannot; she is two hours away and back at work in the morning. Nothing about the chest has changed — the rate is the same, the saturation is the same, she is still comfortable lying still — and the plan that was being considered has just lost the part that made it safe.' });
    }
    // The admitting team answers only if it was asked, and takes half an hour, because what is
    // being asked for is a bed and a plan rather than an emergency.
    if (!this.teamResponded && this.escalationAt !== null
      && until >= this.escalationAt + QUIET_CHEST_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The admitting team answers. They confirm the fracture count and her age from their own record, state that the risk they are admitting her for is the next two to three days rather than tonight, and take ownership of the analgesia plan, of the observation interval, of any respiratory input, and of when she goes home.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the recorded fall and fracture count, what being comfortable at rest does and does not measure, what the count and her age predict, and escalation to the team that owns the plan. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): QuietChestEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-fall-and-what-was-broken':
        if (this.injuryAt !== null) return events;
        this.injuryAt = tick;
        return emit('injury-recorded', `The fall and what it broke are recorded together: an 81-year-old who fell down four steps at home ${this.hoursSinceFall()} hours ago, with ${this.fracturedRibs()} left-sided rib fractures on reported imaging and no pneumothorax or haemothorax, mild chronic obstructive pulmonary disease, and nobody at home. Her age is recorded beside the count rather than in the demographics, because the two of them together are the finding.`);
      case 'record-what-comfortable-at-rest-measures':
        if (this.comfortLimitsAt !== null) return events;
        this.comfortLimitsAt = tick;
        return emit('comfort-limits-recorded', 'What being comfortable at rest does and does not measure is recorded. Lying still, she is comfortable; she has not been asked to take a full breath, to cough, or to get up and walk to a bathroom at three in the morning, and none of those has been observed. A resting respiratory rate and a resting saturation report on the work she is doing now, which is none. They are recorded as what they are and not as a statement about the next three days.');
      case 'record-what-the-count-predicts':
        if (this.countAt !== null) return events;
        this.countAt = tick;
        return emit('count-recorded', `What the count and the age predict is recorded, with the figures attached. In 277 patients aged 65 and over against 187 younger ones with the same mean number of fractures and the same mean injury severity, pneumonia occurred in 31 percent against 17 and mortality was 22 percent against 10, with the odds of death rising per additional rib. In a registry of 405 patients with rib fractures, those 65 and over had five times the adjusted odds of dying despite lower injury severity scores and higher conscious levels. ${this.fracturedRibs()} fractures and 81 years is therefore not a small injury with a number attached; the number is most of what is known.`);
      case 'escalate-to-the-admitting-team':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `The team that owns the plan is asked to take her, ${this.familyCalled ? 'with the fracture count, her age and the fact that she will be alone tonight stated together' : 'with the fracture count and her age stated together'}. What is asked for is a bed, an analgesia plan and an observation interval covering the next two to three days. The reason given is what is true: an injury whose severity is not visible this evening, in a patient in whom it is known to declare itself late.`);
      case 'record-bounded-admission-intent':
        if (this.admissionIntentAt !== null) return events;
        this.admissionIntentAt = tick;
        return emit('admission-intent-recorded', 'Bounded intent is recorded and nothing is chosen: that the qualified team owns the analgesia plan and its route, the observation interval, any respiratory or physiotherapy input, and the decision about when she goes home. No drug, dose, route, block, oxygen target, or discharge date is selected here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, including the part that removes the easy answer. The two cohorts agree on direction: 31 percent pneumonia against 17 and 22 percent mortality against 10 in one, five times the adjusted odds of death in the other, both single-centre and both retrospective, and the first reports the odds of pneumonia per additional rib as 1.16 in its results and 27 percent in its conclusion, which do not match. What does not follow is that any particular intervention fixes it: a systematic review of six randomised trials of continuous epidural analgesia, 223 patients in total and all at high risk of bias, found no significant difference in mortality, pneumonia or ventilation days, and its authors called the evidence low in both quality and quantity. The case for keeping her is that the risk is real and arrives late, not that anybody can point to the thing that will prevent it.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min at rest; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. This partial check supplies no chest record, and every one of these numbers is normal and was taken while she was lying still.`);
      case 'check-chest-record':
        this.chestRecord = this.chestFinding(tick);
        return emit('chest-record-check', `Requested chest record: ${this.chestRecord.mechanism}, ${this.chestRecord.hoursSinceFall} hours ago; ${this.chestRecord.fracturedRibs} left-sided rib fractures reported; pneumothorax ${this.chestRecord.pneumothoraxReported ? 'reported' : 'not reported'}; haemothorax ${this.chestRecord.haemothoraxReported ? 'reported' : 'not reported'}; ${this.chestRecord.copd ? 'known mild chronic obstructive pulmonary disease' : 'no known lung disease'}; ${this.chestRecord.livesAlone ? 'lives alone' : 'lives with family'}; full breath and cough ${this.chestRecord.effortObserved ? 'observed' : 'not observed'}. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.chestRecord = this.chestFinding(tick);
        this.observation = { ...this.observationRecord, ...this.chestRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min at rest; oxygen saturation ${view.spo2Percent}%; ${view.hoursSinceFall} hours since the fall; ${view.fracturedRibs} fractures; ${view.alertness}. ${this.teamResponded ? 'The team has answered and owns the analgesia plan, the observation interval, any respiratory input, and the discharge decision; the risk they are admitting her for is the next two to three days.' : 'Nothing measured has moved, and nothing measured is going to.'} No diagnosis, complication, treatment effect, or outcome is established here.`);
      }
      case 'her-numbers-are-normal-so-she-can-go-home':
        this.normalNumbersAttempted = true;
        return emit('normal-numbers-refused', 'Discharging her on the strength of the observations was refused. Every number on that chart was recorded while she was lying still and doing no work, and the complication these fractures carry is one that develops over days as pain stops her filling the bases of her lungs. A normal resting respiratory rate on the first evening is not evidence about the third morning; it is evidence that she is resting.');
      case 'there-is-no-pneumothorax-on-the-film':
        this.filmClaimAttempted = true;
        return emit('film-claim-refused', 'Reasoning from the absence of a pneumothorax to a minor injury was refused. The film reports what is in the pleural space today, and the risk being weighed is pneumonia and ventilation over the following days, which no image taken this evening addresses. In the cohorts quoted here the elderly and younger groups had the same mean chest injury scores and the same mean number of fractures, and their outcomes differed by a factor of two.');
      case 'she-says-the-pain-is-manageable':
        this.painReportAttempted = true;
        return emit('pain-report-refused', 'Taking her report of manageable pain as reassurance was refused. She is reporting on pain while lying still and being looked after, which is the condition under which it is most manageable and least informative, and she has already said she would rather be at home. Her account is worth having and is recorded; what it cannot do is stand in for an observation of her taking a full breath, coughing, and moving, which nobody has made.');
      case 'send-her-home-with-tablets-and-review-in-a-week':
        this.dischargeAttempted = true;
        return emit('discharge-refused', 'Sending her home with something for the pain and a review in a week was refused. A week is longer than the interval the risk lives in, and prescribing is in any case the qualified team’s. Going home is not the objection and may well be right in two days; recording her this evening as a minor injury safely managed at home is, because that is the sentence that removes the next three days from anybody’s plan.');
      case 'handoff':
        if (this.injuryAt === null || this.comfortLimitsAt === null || this.countAt === null
          || this.escalationAt === null || this.admissionIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the fall and what it broke, record what being comfortable at rest does and does not measure, record what the count and her age predict, ask the team that owns the plan to take her, record bounded qualified-team intent, review the boundaries, and take a current full assessment. A complication, an analgesia plan, and a discharge date are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns the analgesia plan, the observation interval, any respiratory input, and the decision about when she goes home. What travels is the fall with its hours, the fracture count recorded beside her age, what being comfortable at rest does and does not measure, that she will be alone tonight, and the bounded intent as theirs, and ${this.teamObserved ? 'that they confirmed the count and the age from their own record and are admitting her for the next two to three days rather than for tonight' : 'that they have been asked and have not yet answered'}. Practice ends, not care, and no complication or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional recording and escalation lesson. No care was started.');
    }
  }

  private hoursSinceFall() { return this.familyCalled ? 17 : 16; }
  private fracturedRibs() { return 4; }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 84, systolicMmHg: 138, diastolicMmHg: 76,
      respiratoryRateBpm: 18, spo2Percent: 96, coreTemperatureC: 36.6 };
  }

  private chestFinding(tick: number) {
    return { atTick: tick, mechanism: 'fall down four steps at home',
      hoursSinceFall: this.hoursSinceFall(), fracturedRibs: this.fracturedRibs(),
      pneumothoraxReported: false, haemothoraxReported: false, copd: true,
      livesAlone: true, effortObserved: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Entirely normal, taken at rest, and they stay exactly here. The lesson is that this
    // chart is the least informative document in the room.
    return { heartRateBpm: 84, systolicMmHg: 138, diastolicMmHg: 76, meanArterialMmHg: 97,
      respiratoryRateBpm: 18, spo2Percent: 96, coreTemperatureC: 36.6,
      alertness: 'alert, comfortable lying still, and keen to be at home tonight' };
  }

  snapshot(_tick: number): QuietChestSnapshot {
    return {
      injuryRecordedAtTick: this.injuryAt,
      comfortLimitsRecordedAtTick: this.comfortLimitsAt,
      countRecordedAtTick: this.countAt,
      escalationAtTick: this.escalationAt,
      admissionIntentAtTick: this.admissionIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      hoursSinceFall: this.hoursSinceFall(),
      fracturedRibs: this.fracturedRibs(),
      // True in every state: the film is clean, and it is answering a different question.
      pneumothoraxReported: false,
      livesAlone: true,
      // Never observed in this lesson, because nobody has asked her to do it.
      effortObserved: false,
      familyCalled: this.familyCalled,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      normalNumbersAttempted: this.normalNumbersAttempted,
      filmClaimAttempted: this.filmClaimAttempted,
      painReportAttempted: this.painReportAttempted,
      dischargeAttempted: this.dischargeAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      chestRecord: this.chestRecord ? { ...this.chestRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
