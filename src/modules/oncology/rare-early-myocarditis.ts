import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { RareEarlyMyocarditisSnapshot } from '@platform/kernel/protocol';
export type { RareEarlyMyocarditisSnapshot } from '@platform/kernel/protocol';

/**
 * A base rate is not a threshold. This lesson exists because "it is far too rare to be that" is a
 * defensible-sounding sentence about an event with an incidence under one percent, and because the
 * same event has the highest reported case fatality of its class and a window measured in weeks.
 * What decides how hard you look is the consequence and the window, not the frequency alone.
 */
export const RARE_EARLY_MYOCARDITIS_RHYTHM_TICKS = 25 * 60 * TICKS_PER_SECOND;
export const RARE_EARLY_MYOCARDITIS_TEAM_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const RARE_EARLY_MYOCARDITIS_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const RARE_EARLY_MYOCARDITIS_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const RARE_EARLY_MYOCARDITIS_ACTIONS = ['record-the-exposure-interval',
  'record-what-is-present-that-is-not-cardiac', 'arrange-continuous-rhythm-monitoring',
  'escalate-to-both-teams', 'record-bounded-treatment-intent', 'review-boundaries',
  'check-observations', 'check-the-supplied-results', 'reassess', 'handoff',
  'it-is-too-rare-to-be-that', 'the-troponin-is-raised-in-lots-of-things',
  'repeat-the-troponin-in-a-week', 'treat-it-as-a-coronary-syndrome-and-stop-there'] as const;
export type RareEarlyMyocarditisAction = typeof RARE_EARLY_MYOCARDITIS_ACTIONS[number];
export interface RareEarlyMyocarditisEvent { readonly id: string; readonly message: string }

export function supportsRareEarlyMyocarditis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'rare-early-myocarditis-a-base-rate-is-not-a-threshold'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'rare-early-myocarditis').length === 1
    && scenario.timeline.filter((event) => event.target === 'rare-early-myocarditis-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'rare-early-myocarditis-boundary').length === 1;
}

export class RareEarlyMyocarditis {
  private intervalAt: number | null = null;
  private nonCardiacAt: number | null = null;
  private monitoringAt: number | null = null;
  private escalationAt: number | null = null;
  private intentAt: number | null = null;
  private boundariesAt: number | null = null;
  private conductionObserved = false;
  private rhythmChanged = false;
  private teamsResponded = false;
  private teamsObserved = false;
  private rarityAttempted = false;
  private troponinAttempted = false;
  private deferAttempted = false;
  private coronaryOnlyAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: RareEarlyMyocarditisSnapshot['observationRecord'] = null;
  private resultRecord: RareEarlyMyocarditisSnapshot['resultRecord'] = null;
  private observation: RareEarlyMyocarditisSnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: RareEarlyMyocarditisSnapshot['ended'] = null;

  /**
   * The conduction changes only if somebody put him on a monitor. A gate on the vitals alone would
   * be inert, and worse, it would let a learner hand over "unchanged" when what is unchanged is
   * only the part of him anybody is looking at.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.rhythmChanged, this.teamsResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): RareEarlyMyocarditisEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? RARE_EARLY_MYOCARDITIS_TAKEOVER_TICKS : RARE_EARLY_MYOCARDITIS_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: RareEarlyMyocarditisEvent[] = [];
    // Conduction is only observed where somebody is watching it. Nothing here is hidden from a
    // learner who arranged monitoring, and nothing is revealed to one who did not.
    if (!this.rhythmChanged && this.monitoringAt !== null
      && until >= this.monitoringAt + RARE_EARLY_MYOCARDITIS_RHYTHM_TICKS) {
      this.change(() => { this.rhythmChanged = true; });
      events.push({ id: 'conduction-progressed', message: 'The monitor records a change: the first-degree block has become intermittent Mobitz type I, with no symptoms accompanying it. He is still sitting up talking. Conduction is the part of this that moves first and the part nobody sees without a monitor, which is the whole reason one was asked for.' });
    }
    if (!this.teamsResponded && this.escalationAt !== null
      && until >= this.escalationAt + RARE_EARLY_MYOCARDITIS_TEAM_TICKS) {
      this.change(() => { this.teamsResponded = true; });
      events.push({ id: 'teams-responded', message: 'Cardiology and the treating oncology service answer together, which is the point of calling both. They accept suspected checkpoint-inhibitor myocarditis as the working problem, take joint ownership of imaging, further testing, immunosuppressive treatment and whether the drug is ever restarted, and record that neither team owns this alone.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review the exposure interval against the described onset, what is present that does not sound cardiac, continuous rhythm monitoring, and escalation to both teams rather than one. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): RareEarlyMyocarditisEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'record-the-exposure-interval':
        if (this.intervalAt !== null) return events;
        this.intervalAt = tick;
        return emit('interval-recorded', 'The interval is recorded as part of the finding: 4 weeks and two cycles into combination checkpoint therapy. In a multicentre series of 161 patients with checkpoint-inhibitor myocarditis, onset was a median of 4 weeks after the drug was started, at a median of the second cycle, and deaths occurred mainly within 60 days. He is standing in the middle of the described window, and that is not a coincidence to be noted afterwards.');
      case 'record-what-is-present-that-is-not-cardiac':
        if (this.nonCardiacAt !== null) return events;
        this.nonCardiacAt = tick;
        return emit('non-cardiac-recorded', 'What is present that does not sound cardiac is recorded rather than set aside: five days of fatigue, breathlessness only on exertion, aching and weak shoulders, and no chest pain at all. The shoulder symptoms are not incidental colour. Concomitant myositis was among the predictors of cardiotoxicity-related death in that series, and this presentation reaches a cardiologist as a tired man with sore shoulders rather than as a cardiac patient.');
      case 'arrange-continuous-rhythm-monitoring':
        if (this.monitoringAt !== null) return events;
        this.monitoringAt = tick;
        return emit('monitoring-arranged', 'Continuous rhythm monitoring is arranged, and the reason is recorded with it: the supplied electrocardiogram already shows new first-degree block, and conduction disease is the part of this that can move without producing a symptom. A single strip is a photograph of something that is being watched for because it changes. This is a monitoring decision, not a treatment.');
      case 'escalate-to-both-teams':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `Cardiology and the treating oncology service are contacted together${this.rhythmChanged ? ', with the change on the monitor stated as it stands' : ''}. Calling one is the ordinary failure here: cardiology receives a troponin without the drug, and oncology receives a drug without the conduction. The referral names the suspected problem, the exposure interval, and the shoulder symptoms, and asks for the decisions that belong jointly to them.`);
      case 'record-bounded-treatment-intent':
        if (this.intentAt !== null) return events;
        this.intentAt = tick;
        return emit('intent-recorded', 'Bounded intent is recorded and nothing is given: that the qualified teams own imaging, further cardiac and muscle testing, immunosuppressive treatment, cardiac-rhythm management, and whether the checkpoint inhibitor is ever restarted, and that withholding the next cycle pending their decision is theirs to confirm. No drug, dose, route, or threshold is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. Reported incidence in trials is roughly 0.1 to 1 percent and higher with combination regimens, and historical mortality is quoted at 30 to 50 percent; in a pharmacovigilance analysis, myocarditis had the highest fatality of any checkpoint-inhibitor toxicity, at 52 of 131 reported cases. Those two numbers are doing different jobs: one says you will rarely meet this, the other says what it costs to meet it late. The 161-patient series is retrospective and drawn from centres that see these patients, so it describes people already diagnosed rather than everyone at risk, and its predictors are associations. Nothing here estimates a probability for this man.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C; rhythm ${this.observationRecord.rhythm}. ${this.observationRecord.monitored ? 'He is on a monitor.' : 'He is not on a monitor, so the rhythm is whatever the last strip showed.'} This partial check supplies no results and no history.`);
      case 'check-the-supplied-results':
        this.resultRecord = this.resultFinding(tick);
        return emit('results-check', `Requested supplied results: ${this.resultRecord.weeksSinceStart} weeks and ${this.resultRecord.cyclesGiven} cycles into combination checkpoint therapy; troponin markedly raised on the supplied assay; electrocardiogram ${this.resultRecord.conduction}; shoulder girdle weakness present. No test is acquired or interpreted by this learner. This partial check supplies no observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.resultRecord = this.resultFinding(tick);
        this.observation = { ...this.observationRecord, ...this.resultRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.teamsResponded) this.teamsObserved = true;
        const view = this.observation;
        return emit(this.teamsResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; respiratory rate ${view.respiratoryRateBpm}/min; oxygen saturation ${view.spo2Percent}% on air; rhythm ${view.rhythm}; ${view.alertness}. ${this.teamsResponded ? 'Both teams have answered and hold this jointly.' : this.rhythmChanged ? 'The conduction has moved on the monitor while he has not.' : 'He looks the same as he did, which is what this looks like until it does not.'} No diagnosis, treatment effect, or outcome is established here.`);
      }
      case 'it-is-too-rare-to-be-that':
        this.rarityAttempted = true;
        return emit('rarity-refused', 'Setting it aside as too rare was refused. An incidence of roughly 0.1 to 1 percent is a statement about how often you will meet this, not about how hard to look when the person in front of you is in the described window with a raised troponin and new conduction disease. The same event carries the highest reported fatality of its class. A base rate sets your expectation; the consequence and the window set your threshold.');
      case 'the-troponin-is-raised-in-lots-of-things':
        this.troponinAttempted = true;
        return emit('troponin-refused', 'Discounting the troponin because it rises in many conditions was refused. It does, and that is a reason to explain this one rather than to file it. Here it sits with a new conduction abnormality, shoulder-girdle weakness, and a four-week interval on a drug known to cause exactly this pattern. The value is not the finding; the company it keeps is.');
      case 'repeat-the-troponin-in-a-week':
        this.deferAttempted = true;
        return emit('defer-refused', 'Sending him home to repeat the troponin in a week was refused. Deaths in the reported series occurred mainly within 60 days of an onset that was itself around 4 weeks, and conduction disease progresses without warning anybody. A repeat interval longer than the interval over which this deteriorates is a plan to find out afterwards.');
      case 'treat-it-as-a-coronary-syndrome-and-stop-there':
        this.coronaryOnlyAttempted = true;
        return emit('coronary-only-refused', 'Running the coronary pathway and stopping there was refused — not for considering it, which is reasonable, but for stopping. That pathway does not ask what he is taking, does not account for the shoulders, and reaches a normal or unhelpful answer without excluding the thing the exposure makes likely. Selecting and giving any treatment is in any case a qualified-team decision, and none is exposed here.');
      case 'handoff':
        if (this.intervalAt === null || this.nonCardiacAt === null || this.monitoringAt === null
          || this.escalationAt === null || this.intentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Record the exposure interval against the described onset, record what is present that does not sound cardiac, arrange continuous rhythm monitoring, contact both teams, record bounded qualified-team treatment intent, review the boundaries, and take a current assessment including the rhythm. A confirmed diagnosis, an imaging result, and a stable rhythm are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving teams own imaging, further testing, immunosuppressive treatment, rhythm management, and any restart. What travels is the four-week two-cycle interval, the raised troponin with the new conduction abnormality and the shoulder weakness together, that he is on continuous monitoring and why, ${this.rhythmChanged ? 'that the conduction has already moved once while he was watched, ' : ''}the bounded intent as the qualified teams’ decision, and ${this.teamsObserved ? 'that both teams have accepted it jointly' : 'that both have been contacted and have not yet answered'}. Practice ends, not care, and no diagnosis or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional checkpoint-inhibitor myocarditis lesson. No care was started.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 72, systolicMmHg: 118, diastolicMmHg: 70,
      respiratoryRateBpm: 18, spo2Percent: 96, coreTemperatureC: 36.6,
      rhythm: this.rhythmChanged ? 'intermittent Mobitz type I second-degree block'
        : 'sinus with first-degree block',
      monitored: this.monitoringAt !== null };
  }

  private resultFinding(tick: number) {
    return { atTick: tick, weeksSinceStart: 4, cyclesGiven: 2,
      conduction: this.rhythmChanged ? 'now intermittent Mobitz type I second-degree block'
        : 'new first-degree atrioventricular block',
      troponinMarkedlyRaised: true };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // He looks well throughout. The only thing that moves is conduction, and only where somebody
    // is watching it. A collapsing patient would answer the question the lesson is asking.
    return { heartRateBpm: 72, systolicMmHg: 118, diastolicMmHg: 70, meanArterialMmHg: 86,
      respiratoryRateBpm: 18, spo2Percent: 96, coreTemperatureC: 36.6,
      alertness: 'alert, orientated, and apologising for wasting anybody’s time' };
  }

  snapshot(_tick: number): RareEarlyMyocarditisSnapshot {
    return {
      intervalRecordedAtTick: this.intervalAt, nonCardiacRecordedAtTick: this.nonCardiacAt,
      monitoringAtTick: this.monitoringAt, escalationAtTick: this.escalationAt,
      treatmentIntentAtTick: this.intentAt, boundariesReviewedAtTick: this.boundariesAt,
      weeksSinceStart: 4, cyclesGiven: 2,
      // Raised in every state, and never on its own enough to decide anything.
      troponinMarkedlyRaised: true,
      monitored: this.monitoringAt !== null,
      conductionProgressed: this.rhythmChanged,
      conductionObserved: this.conductionObserved,
      teamsResponded: this.teamsResponded,
      teamsObserved: this.teamsObserved,
      rarityDismissalAttempted: this.rarityAttempted,
      troponinDismissalAttempted: this.troponinAttempted,
      deferralAttempted: this.deferAttempted,
      coronaryOnlyAttempted: this.coronaryOnlyAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      resultRecord: this.resultRecord ? { ...this.resultRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
