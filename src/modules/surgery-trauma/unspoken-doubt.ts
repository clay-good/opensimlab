import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { UnspokenDoubtSnapshot } from '@platform/kernel/protocol';
export type { UnspokenDoubtSnapshot } from '@platform/kernel/protocol';

/**
 * The interval nobody else in the room can see.
 *
 * You have noticed that the radiograph on the screen is labelled for the other side. Nobody has
 * done anything wrong yet, the consultant is scrubbed and waiting, and the only thing standing
 * between the noticing and the saying is you. That interval does not appear on any chart, no
 * observation records it, and it is the only one in this module that nobody but the learner
 * will ever know existed.
 *
 * It is the module's fifth and last lesson about not waiting, and its fifth mechanism. The
 * interval has been spent on a better number, in a corridor, in a queue nobody owns, and on
 * somebody's arrival. This one is spent inside the person holding the doubt — which is where
 * the module ends, because it is the only delay a learner can always do something about.
 */
// The knife must be asked for before anybody can answer, or an exemplary learner — who
// speaks at once — would never see what the interval looks like while it is being spent.
export const UNSPOKEN_DOUBT_KNIFE_TICKS = 25 * TICKS_PER_SECOND;
export const UNSPOKEN_DOUBT_TEAM_TICKS = 40 * TICKS_PER_SECOND;
export const UNSPOKEN_DOUBT_TAKEOVER_TICKS = 10 * 60 * TICKS_PER_SECOND;
export const UNSPOKEN_DOUBT_SESSION_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const UNSPOKEN_DOUBT_ACTIONS = ['state-what-you-have-noticed',
  'state-what-would-make-you-wrong', 'state-the-cost-of-each-mistake',
  'say-it-before-the-incision', 'record-bounded-team-intent', 'review-boundaries',
  'check-observations', 'check-checklist-record', 'reassess', 'handoff',
  'wait-until-someone-more-senior-notices', 'you-are-probably-misreading-it',
  'mention-it-afterwards', 'ask-a-colleague-quietly-first'] as const;
export type UnspokenDoubtAction = typeof UNSPOKEN_DOUBT_ACTIONS[number];
export interface UnspokenDoubtEvent { readonly id: string; readonly message: string }

export function supportsUnspokenDoubt(scenario: Scenario): boolean {
  return scenario.metadata.id === 'unspoken-doubt-an-interval-nobody-else-can-see'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'unspoken-doubt').length === 1
    && scenario.timeline.filter((event) => event.target === 'unspoken-doubt-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'unspoken-doubt-boundary').length === 1;
}

export class UnspokenDoubt {
  private noticedAt: number | null = null;
  private fallibilityAt: number | null = null;
  private asymmetryAt: number | null = null;
  private spokeAt: number | null = null;
  private teamIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private knifeRequested = false;
  private teamResponded = false;
  private teamObserved = false;
  private waitForSeniorAttempted = false;
  private selfDoubtAttempted = false;
  private afterwardsAttempted = false;
  private quietAskAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: UnspokenDoubtSnapshot['observationRecord'] = null;
  private checklistRecord: UnspokenDoubtSnapshot['checklistRecord'] = null;
  private observation: UnspokenDoubtSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: UnspokenDoubtSnapshot['ended'] = null;

  /**
   * The patient is anaesthetised and entirely stable, so the gate tracks the room: whether the
   * knife has been asked for, and whether anybody has answered the thing you said.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.knifeRequested, this.teamResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): UnspokenDoubtEvent[] {
    if (this.ended) return [];
    const terminal = this.spokeAt === null ? UNSPOKEN_DOUBT_TAKEOVER_TICKS : UNSPOKEN_DOUBT_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: UnspokenDoubtEvent[] = [];
    if (!this.knifeRequested && until >= UNSPOKEN_DOUBT_KNIFE_TICKS) {
      this.change(() => { this.knifeRequested = true; });
      events.push({ id: 'knife-requested', message: 'The consultant holds out a hand and asks for the knife. Nothing about the patient has changed — the pressure, the saturation, the ventilator, all exactly as they were — and nothing has been done wrong by anybody. The room is simply one step further along than it was a moment ago, and the thing you noticed is still only in your head.' });
    }
    // Nobody argues. That is the honest finding and the one this lesson exists to deliver: in
    // the ordinary case the room stops the moment somebody says the words.
    if (!this.teamResponded && this.spokeAt !== null
      && until >= this.spokeAt + UNSPOKEN_DOUBT_TEAM_TICKS) {
      this.change(() => { this.teamResponded = true; });
      events.push({ id: 'team-responded', message: 'The consultant stops, puts the hand down, and says thank you. Nobody is annoyed. The scrub practitioner reaches for the notes, somebody pulls the request form back up on the screen, and the team re-checks the side against the consent, the mark and the imaging before anything else happens. The whole exchange takes less time than the pause you spent deciding whether to have it.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review what you noticed and stated, what would have to be true for you to be wrong, the cost of each of the two mistakes, and saying it before the incision. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): UnspokenDoubtEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'state-what-you-have-noticed':
        if (this.noticedAt !== null) return events;
        this.noticedAt = tick;
        return emit('observation-recorded', `What you have noticed is put into words, plainly and without a theory attached: the radiograph displayed on the screen carries the other side in its label, and the mark on the skin and the consent form both say this side. That is the whole of it — an observation about a discrepancy, ${this.knifeRequested ? 'stated after the knife has been asked for' : 'stated before anybody has asked for anything'}, and not a claim that anybody has made a mistake.`);
      case 'state-what-would-make-you-wrong':
        if (this.fallibilityAt !== null) return events;
        this.fallibilityAt = tick;
        return emit('fallibility-recorded', 'What would have to be true for you to be wrong is stated out loud, because saying it first is what makes the interruption easy for everybody to accept: the image on the screen may belong to a different patient, the label may be a display artefact, you may be reading a mirrored view, or you may simply have misread it. All of those are likely, and none of them can be settled by anybody who is still only thinking about it.');
      case 'state-the-cost-of-each-mistake':
        if (this.asymmetryAt !== null) return events;
        this.asymmetryAt = tick;
        return emit('asymmetry-recorded', 'The cost of each of the two possible mistakes is stated, because it is the only calculation in this room that is not close. Being wrong out loud costs about ninety seconds, a re-check that was going to be quick anyway, and a small amount of your own embarrassment. Being right and silent costs the other side of a person. The two are not comparable, and noticing that they are not is what makes the decision small.');
      case 'say-it-before-the-incision':
        if (this.spokeAt !== null) return events;
        this.spokeAt = tick;
        return emit('spoken', `You say it, in the room, to everybody, before anything is cut${this.knifeRequested ? ' — after the knife has been asked for, which is later than it needed to be and still in time' : ', while there is nothing to undo'}. Not a hint, not a question aimed at nobody, and not a private word: the observation, the ways you might be wrong, and a request to check the side against the consent, the mark and the imaging before proceeding.`);
      case 'record-bounded-team-intent':
        if (this.teamIntentAt !== null) return events;
        this.teamIntentAt = tick;
        return emit('team-intent-recorded', 'Bounded intent is recorded and nothing is decided: that the team owns the re-check and how it is done, owns whether the imaging is re-requested or the notes retrieved, owns whether the operation proceeds, is delayed, or changes, and owns everything about the operation itself. Nothing is stopped by you and nothing is chosen by you; what you have contributed is a sentence.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries, and the last of them is about this rehearsal itself. A narrative synthesis screened 4,822 publications and included 31 studies on challenging authority in the operating room, finding hierarchy, organisational culture and education the most frequently observed and tested themes, and barriers largely modifiable within institutions. A scale study in anaesthesiology residents and faculty found the factors that predict speaking up are partly intrapersonal — self-efficacy, expectations about how colleagues will react, and assertive attitude accounted for 73 percent of the variance in a three-factor solution, with training level significantly associated with two of them. And a systematic review of fourteen interventions aimed at psychological safety, speaking up and voice found mixed results, no consistent improvement, a lack of objective outcome measures, and specific doubt that education alone changes deeply rooted speaking-up behaviour. That last one is about exercises like this one, and it is included rather than left out.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; ventilated at a set rate of ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}%; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C. This partial check supplies no checklist record. The patient is anaesthetised and perfectly stable, and no number here will ever be the thing that catches this.`);
      case 'check-checklist-record':
        this.checklistRecord = this.checklistFinding(tick);
        return emit('checklist-record-check', `Requested checklist and documentation record: consent form side ${this.checklistRecord.consentSide}; skin marking side ${this.checklistRecord.markedSide}; side in the label of the displayed image ${this.checklistRecord.imageLabelSide}; team brief ${this.checklistRecord.briefCompleted ? 'completed' : 'not completed'}; anybody else having raised the discrepancy ${this.checklistRecord.raisedByAnyoneElse ? 'yes' : 'nobody'}; ${this.checklistRecord.incisionMade ? 'incision made' : 'no incision made'}. This partial check supplies no new observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.checklistRecord = this.checklistFinding(tick);
        this.observation = { ...this.observationRecord, ...this.checklistRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamResponded) this.teamObserved = true;
        const view = this.observation;
        return emit(this.teamResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; consent ${view.consentSide}; mark ${view.markedSide}; displayed image labelled ${view.imageLabelSide}; ${view.incisionMade ? 'incision made' : 'no incision made'}; ${view.alertness}. ${this.teamResponded ? 'The team has stopped, nobody was annoyed, and it owns the re-check, the imaging, and whether the operation proceeds.' : 'Nothing measured has moved, and the discrepancy is still only known to you.'} No diagnosis, error, treatment effect, or outcome is established here.`);
      }
      case 'wait-until-someone-more-senior-notices':
        this.waitForSeniorAttempted = true;
        return emit('wait-for-senior-refused', 'Waiting for somebody senior to notice was refused. Everybody in the room is competent and everybody is looking at their own part of it; the reason you can see this is that you happen to be looking at the screen, not that you know more than anybody. A discrepancy that only one person has seen is not made safer by that person waiting, and seniority is not a queue for observations.');
      case 'you-are-probably-misreading-it':
        this.selfDoubtAttempted = true;
        return emit('self-doubt-refused', 'Settling it privately by deciding you are probably wrong was refused. You very likely are wrong — that is the ordinary case, and it is why saying so first makes this easy — but "probably wrong" is a reason to check rather than a reason to be quiet. The only version of this that cannot be corrected is the one where you resolved it inside your own head.');
      case 'mention-it-afterwards':
        this.afterwardsAttempted = true;
        return emit('afterwards-refused', 'Mentioning it afterwards was refused. Afterwards is on the other side of the only moment when the observation is worth anything; it turns a ninety-second re-check into an incident report. Nothing about raising it later is kinder to anybody in this room, and it is not kinder at all to the patient.');
      case 'ask-a-colleague-quietly-first':
        this.quietAskAttempted = true;
        return emit('quiet-ask-refused', 'Checking quietly with the person next to you first was refused. It feels like the polite version and it costs the interval twice — once for your pause and once for theirs — while giving the room a whispered exchange to notice instead of a sentence to act on. Say it to everybody, including the ways you might be wrong; that is what makes it easy to answer.');
      case 'handoff':
        if (this.noticedAt === null || this.fallibilityAt === null || this.asymmetryAt === null
          || this.spokeAt === null || this.teamIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'State what you have noticed, state what would make you wrong, state the cost of each of the two mistakes, say it before the incision, record bounded team intent, review the boundaries, and take a current full assessment. A confirmed error, a completed re-check, and a decision about the operation are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The team owns the re-check, the imaging, whether the operation proceeds, and everything in it. What travels is what was noticed and when, that the ways you might be wrong were said first, the asymmetry between the two mistakes, that it was said out loud in the room before anything was cut, and the bounded intent as theirs, and ${this.teamObserved ? 'that the room stopped without anybody being annoyed and re-checked the side against the consent, the mark and the imaging' : 'that it has been said and nobody has answered yet'}. Practice ends, not care, and no error, effect, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional speaking-up lesson. No care was started.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 78, systolicMmHg: 110, diastolicMmHg: 64,
      respiratoryRateBpm: 12, spo2Percent: 99, coreTemperatureC: 36.4 };
  }

  private checklistFinding(tick: number) {
    return { atTick: tick, consentSide: 'left', markedSide: 'left',
      imageLabelSide: 'right', briefCompleted: true,
      raisedByAnyoneElse: false, incisionMade: false };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // Anaesthetised, stable, and unchanging throughout. No number on this monitor will ever be
    // the thing that catches a discrepancy in a label, which is the point.
    return { heartRateBpm: 78, systolicMmHg: 110, diastolicMmHg: 64, meanArterialMmHg: 79,
      respiratoryRateBpm: 12, spo2Percent: 99, coreTemperatureC: 36.4,
      alertness: 'anaesthetised, ventilated, draped, and entirely stable' };
  }

  snapshot(_tick: number): UnspokenDoubtSnapshot {
    return {
      noticedStatedAtTick: this.noticedAt,
      fallibilityStatedAtTick: this.fallibilityAt,
      asymmetryStatedAtTick: this.asymmetryAt,
      spokenAtTick: this.spokeAt,
      teamIntentAtTick: this.teamIntentAt,
      boundariesReviewedAtTick: this.boundariesAt,
      // True in every state: the discrepancy is never resolved by the lesson, nobody else ever
      // raises it, and nothing is ever cut.
      consentSide: 'left',
      markedSide: 'left',
      imageLabelSide: 'right',
      raisedByAnyoneElse: false,
      incisionMade: false,
      knifeRequested: this.knifeRequested,
      teamResponded: this.teamResponded,
      teamObserved: this.teamObserved,
      waitForSeniorAttempted: this.waitForSeniorAttempted,
      selfDoubtAttempted: this.selfDoubtAttempted,
      afterwardsAttempted: this.afterwardsAttempted,
      quietAskAttempted: this.quietAskAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      checklistRecord: this.checklistRecord ? { ...this.checklistRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
