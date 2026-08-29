import type { Scenario } from '@anesthesia/scenarios/types';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { NormalTestToxicitySnapshot } from '@platform/kernel/protocol';
export type { NormalTestToxicitySnapshot } from '@platform/kernel/protocol';

/**
 * The one action that cannot wait belongs to whoever is standing here. This lesson exists because
 * the pre-treatment test came back normal and is printed at the top of the letter, and because the
 * tablets are in the patient's own bag: stopping them is a physical act by the person in front of
 * him, not a message left for a service that will call back tomorrow.
 */
export const NORMAL_TEST_TOXICITY_NEXT_DOSE_TICKS = 40 * 60 * TICKS_PER_SECOND;
export const NORMAL_TEST_TOXICITY_SERVICE_TICKS = 60 * 60 * TICKS_PER_SECOND;
export const NORMAL_TEST_TOXICITY_TAKEOVER_TICKS = 180 * 60 * TICKS_PER_SECOND;
export const NORMAL_TEST_TOXICITY_SESSION_TICKS = 8 * 60 * 60 * TICKS_PER_SECOND;
export const NORMAL_TEST_TOXICITY_ACTIONS = ['withhold-the-drug-now',
  'record-what-the-normal-test-does-not-exclude', 'record-the-toxicity-and-its-severity',
  'escalate-to-acute-oncology', 'record-bounded-supportive-intent', 'review-boundaries',
  'check-observations', 'check-the-treatment-record', 'reassess', 'handoff',
  'the-test-was-normal-so-not-the-drug', 'wait-for-oncology-before-stopping',
  'advise-him-to-halve-the-dose', 'treat-the-symptoms-and-review-tomorrow'] as const;
export type NormalTestToxicityAction = typeof NORMAL_TEST_TOXICITY_ACTIONS[number];
export interface NormalTestToxicityEvent { readonly id: string; readonly message: string }

export function supportsNormalTestToxicity(scenario: Scenario): boolean {
  return scenario.metadata.id === 'normal-test-toxicity-the-dose-in-his-bag'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'normal-test-toxicity').length === 1
    && scenario.timeline.filter((event) => event.target === 'normal-test-toxicity-evidence').length === 1
    && scenario.timeline.filter((event) => event.target === 'normal-test-toxicity-boundary').length === 1;
}

export class NormalTestToxicity {
  private withheldAt: number | null = null;
  private exclusionsAt: number | null = null;
  private toxicityAt: number | null = null;
  private escalationAt: number | null = null;
  private supportiveIntentAt: number | null = null;
  private boundariesAt: number | null = null;
  private nextDoseDue = false;
  private nextDoseTaken = false;
  private serviceResponded = false;
  private serviceObserved = false;
  private testExclusionAttempted = false;
  private waitAttempted = false;
  private doseAdviceAttempted = false;
  private symptomaticAttempted = false;
  private phase = 0;
  private observedPhase: number | null = null;
  private observationRecord: NormalTestToxicitySnapshot['observationRecord'] = null;
  private treatmentRecord: NormalTestToxicitySnapshot['treatmentRecord'] = null;
  private observation: NormalTestToxicitySnapshot['observation'] = null;
  private feedback: string | null = null;
  private ended: NormalTestToxicitySnapshot['ended'] = null;

  /**
   * Unlike this module's other two lessons, something here genuinely happens if the learner does
   * not act: the next dose falls due and, unwithheld, is taken. The gate tracks that, because it
   * is the one state change a reassessment must not be allowed to miss.
   */
  private clinicalState() {
    return JSON.stringify([this.vitals(), this.nextDoseDue, this.nextDoseTaken, this.serviceResponded]);
  }
  private change(mutate: () => void) {
    const before = this.clinicalState(); mutate();
    if (before !== this.clinicalState()) this.phase += 1;
  }

  advance(tick: number): NormalTestToxicityEvent[] {
    if (this.ended) return [];
    const terminal = this.escalationAt === null ? NORMAL_TEST_TOXICITY_TAKEOVER_TICKS : NORMAL_TEST_TOXICITY_SESSION_TICKS;
    const until = Math.min(tick, terminal);
    const events: NormalTestToxicityEvent[] = [];
    if (!this.nextDoseDue && until >= NORMAL_TEST_TOXICITY_NEXT_DOSE_TICKS) {
      const withheld = this.withheldAt !== null;
      this.change(() => { this.nextDoseDue = true; this.nextDoseTaken = !withheld; });
      events.push(withheld
        ? { id: 'next-dose-withheld', message: 'The evening dose falls due. He takes the box out of his bag, looks at it, and puts it back, because he has been told plainly not to take it and why. Nothing else about him has changed.' }
        : { id: 'next-dose-taken', message: 'The evening dose falls due. Nobody has told him not to take it, so he takes it, exactly as he has been instructed to for the last nine days. He is doing what he was asked to do. This is what a decision deferred to tomorrow actually costs today, and it is recorded as a fact rather than as a predicted harm.' });
    }
    // Acute oncology answers only when called. This lesson can be failed by waiting for them.
    if (!this.serviceResponded && this.escalationAt !== null
      && until >= this.escalationAt + NORMAL_TEST_TOXICITY_SERVICE_TICKS) {
      this.change(() => { this.serviceResponded = true; });
      events.push({ id: 'service-responded', message: 'The acute oncology service answers. They confirm the drug should stay stopped, take ownership of grading, of any further treatment, and of whether and how it is ever restarted, and record that a wild-type result does not exclude what is in front of them.' });
    }
    if (tick >= terminal) {
      this.ended = 'instructor-takeover';
      events.push({ id: 'instructor-takeover', message: 'Instructor takeover ends the unfinished rehearsal. Review withholding the drug at once, what a normal pre-treatment test does and does not exclude, the recorded toxicity, and escalation to the service that owns the treatment. This authored stop predicts no patient outcome.' });
    }
    return events;
  }

  apply(action: unknown, tick: number): NormalTestToxicityEvent[] {
    const events = this.advance(tick);
    const emit = (id: string, message: string) => {
      if (!this.ended || id === 'handoff') this.feedback = message;
      return [...events, { id, message }];
    };
    if (this.ended) return emit('action-refused', 'This practice branch has ended. Open the debrief or restart.');
    switch (action) {
      case 'withhold-the-drug-now':
        if (this.withheldAt !== null) return events;
        this.withheldAt = tick;
        return emit('drug-withheld', `The oral anticancer drug is stopped now, and stopped physically: he is told not to take the next dose, told why, and the box in his bag is addressed rather than assumed. ${this.nextDoseTaken ? 'The evening dose has already been taken, which is what deferring this cost.' : 'The evening dose has not yet fallen due.'} This is the one action here that does not need anyone else’s permission, and it is reversible if the treating team disagrees.`);
      case 'record-what-the-normal-test-does-not-exclude':
        if (this.exclusionsAt !== null) return events;
        this.exclusionsAt = tick;
        return emit('exclusions-recorded', 'The record states what the pre-treatment genotype does and does not support. In the prospective cohort that established genotype-guided dosing, severe fluoropyrimidine toxicity still occurred in 23 percent of the wild-type patients — 231 of 1018 — and in 39 percent of variant carriers even after their doses were reduced. Severe toxicity is reported in up to 30 percent of patients treated with these drugs. The panel of variants tested identifies a group at higher risk. It does not clear the rest.');
      case 'record-the-toxicity-and-its-severity':
        if (this.toxicityAt !== null) return events;
        this.toxicityAt = tick;
        return emit('toxicity-recorded', 'The toxicity is recorded as observed and as severe rather than as unwell: diarrhoea at eight stools a day above his baseline since yesterday, a mouth too sore to eat, and painful, peeling palms and soles, on day 9 of the first cycle. It is recorded against the cycle and the day, because the timing is part of the finding and a first-cycle presentation is not the same as one in the sixth.');
      case 'escalate-to-acute-oncology':
        if (this.escalationAt !== null) return events;
        this.escalationAt = tick;
        return emit('escalation-requested', `Acute oncology is contacted, ${this.withheldAt === null ? 'though the drug has not yet been stopped, which should not have waited for this call' : 'with the drug already stopped'}. The referral reports what has been done and asks for what belongs to them: grading, further treatment, and whether the drug is ever restarted and how. The service that prescribed it is the service that owns it, but it is not the service holding the box.`);
      case 'record-bounded-supportive-intent':
        if (this.supportiveIntentAt !== null) return events;
        this.supportiveIntentAt = tick;
        return emit('supportive-intent-recorded', 'Bounded intent is recorded and nothing is administered: that the qualified team may grade this toxicity and consider supportive treatment, rehydration, mouth care, and specific antidotal treatment where they judge it indicated, and that all of those are theirs to select. No drug, dose, route, fluid, or threshold is chosen here, and none is displayed.');
      case 'review-boundaries':
        if (this.boundariesAt !== null) return events;
        this.boundariesAt = tick;
        return emit('boundary-review', 'Supplied boundaries. Pre-treatment screening covers a defined panel of variants — those studied were associated with severe toxicity at adjusted relative risks of roughly 2.9 to 4.4 in a meta-analysis of 7365 patients — and a wild-type result on that panel means those variants were absent, not that the enzyme works. Enzyme activity has other causes, and the prospective cohort found nearly a quarter of wild-type patients suffered severe toxicity anyway. Nothing here diagnoses a deficiency, and none of these figures is a probability for this patient. What is in front of you is a clinical picture in the first cycle, which is the thing being acted on.');
      case 'check-observations':
        this.observationRecord = this.observationFinding(tick);
        return emit('observation-check', `Requested observations: heart rate ${this.observationRecord.heartRateBpm}/min; blood pressure ${this.observationRecord.systolicMmHg}/${this.observationRecord.diastolicMmHg} mmHg; respiratory rate ${this.observationRecord.respiratoryRateBpm}/min; oxygen saturation ${this.observationRecord.spo2Percent}% on air; temperature ${this.observationRecord.coreTemperatureC.toFixed(1)} C; ${this.observationRecord.stoolsToday} stools today. This partial check supplies nothing about the treatment record.`);
      case 'check-the-treatment-record':
        this.treatmentRecord = this.treatmentFinding(tick);
        return emit('treatment-check', `Requested treatment record: an oral fluoropyrimidine, cycle ${this.treatmentRecord.cycleNumber}, day ${this.treatmentRecord.dayOfCycle}; pre-treatment genotype panel reported ${this.treatmentRecord.genotypeResult}; the supply is ${this.treatmentRecord.suppliedToPatient ? 'held by the patient himself' : 'held by the service'}; drug currently ${this.treatmentRecord.drugWithheld ? 'withheld' : 'not withheld'}. This partial check supplies no observations.`);
      case 'reassess': {
        this.observationRecord = this.observationFinding(tick);
        this.treatmentRecord = this.treatmentFinding(tick);
        this.observation = { ...this.observationRecord, ...this.treatmentRecord, ...this.vitals() };
        this.observedPhase = this.phase;
        if (this.serviceResponded) this.serviceObserved = true;
        const view = this.observation;
        return emit(this.serviceResponded ? 'reviewed-reassessment' : 'initial-reassessment',
          `Fresh fictional assessment: heart rate ${view.heartRateBpm}/min; blood pressure ${view.systolicMmHg}/${view.diastolicMmHg} mmHg; temperature ${view.coreTemperatureC.toFixed(1)} C; ${view.stoolsToday} stools today; drug ${view.drugWithheld ? 'withheld' : 'not withheld'}; ${view.alertness}. ${this.serviceResponded ? 'Acute oncology has answered and owns grading, further treatment, and any restart.' : this.nextDoseTaken ? 'The evening dose was taken while this was being decided.' : 'Nothing has been given since he arrived.'} No diagnosis of enzyme deficiency, treatment effect, grade, or outcome is established here.`);
      }
      case 'the-test-was-normal-so-not-the-drug':
        this.testExclusionAttempted = true;
        return emit('test-exclusion-refused', 'Excluding the drug on the strength of the pre-treatment genotype was refused. In the cohort that established that testing, 231 of 1018 wild-type patients — 23 percent — still had severe toxicity, and severe toxicity occurs in up to 30 percent of patients on these drugs overall. A normal result on a four-variant panel means those four variants were absent. Reading it as a clearance turns a risk-stratifying test into an exclusion test it was never able to be.');
      case 'wait-for-oncology-before-stopping':
        this.waitAttempted = true;
        return emit('wait-refused', 'Waiting for acute oncology to call back before stopping was refused. Withholding a drug is reversible and needs nobody’s permission; the next dose is not reversible once it is swallowed, and he will take it, because he has been correctly told to take it every day for nine days. Escalation and withholding are not sequential, and only one of them is in this room.');
      case 'advise-him-to-halve-the-dose':
        this.doseAdviceAttempted = true;
        return emit('dose-advice-refused', 'Advising him to halve the dose was refused. Dose modification is a treatment decision belonging to the qualified team, it requires the grading that has not been done, and it leaves him taking a drug in the presence of severe toxicity while appearing to be an action. Stopping and asking is available and is not the same thing.');
      case 'treat-the-symptoms-and-review-tomorrow':
        this.symptomaticAttempted = true;
        return emit('symptomatic-refused', 'Treating the symptoms and reviewing tomorrow was refused. It leaves the cause running: the symptoms are being produced by a drug he will take again this evening unless somebody stops it. Supportive treatment is not wrong and belongs to the qualified team; offering it instead of withholding is what was refused.');
      case 'handoff':
        if (this.withheldAt === null || this.exclusionsAt === null || this.toxicityAt === null
          || this.escalationAt === null || this.supportiveIntentAt === null || this.boundariesAt === null
          || this.observation === null || this.observedPhase !== this.phase) {
          return emit('handoff-refused', 'Withhold the drug, record what the normal pre-treatment test does and does not exclude, record the toxicity with its severity and the day of the cycle, contact acute oncology, record bounded qualified-team supportive intent, review the boundaries, and take a current full assessment. A confirmed grade, an enzyme assay, and a restart plan are not handoff gates.');
        }
        this.ended = 'handoff';
        return emit('handoff', `The receiving team owns grading, further treatment, and whether and how the drug is ever restarted. What travels is that the drug is stopped and when, what the normal pre-treatment panel does and does not exclude, the toxicity with its severity and the day of the cycle, the bounded supportive intent as the qualified team’s decision, ${this.nextDoseTaken ? 'that a further dose was taken before it was stopped, ' : ''}and ${this.serviceObserved ? 'that acute oncology has confirmed the drug stays stopped' : 'that acute oncology has been contacted and has not yet answered'}. Practice ends, not care, and no deficiency, grade, or outcome is certified.`);
      default:
        return emit('action-refused', 'That choice is not part of this fictional oral-anticancer-toxicity lesson. No care was started.');
    }
  }

  private observationFinding(tick: number) {
    return { atTick: tick, heartRateBpm: 96, systolicMmHg: 112, diastolicMmHg: 68,
      respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.9, stoolsToday: 8 };
  }

  private treatmentFinding(tick: number) {
    return { atTick: tick, cycleNumber: 1, dayOfCycle: 9,
      genotypeResult: 'wild type for the four variants tested', suppliedToPatient: true,
      drugWithheld: this.withheldAt !== null };
  }

  rhythm(): 'sinus' { return 'sinus'; }

  vitals() {
    // He is dry and uncomfortable rather than shocked. A collapsing patient would make the
    // decision for the learner, and the decision is the lesson.
    return { heartRateBpm: 96, systolicMmHg: 112, diastolicMmHg: 68, meanArterialMmHg: 83,
      respiratoryRateBpm: 16, spo2Percent: 98, coreTemperatureC: 36.9,
      alertness: 'alert, orientated, and finding it painful to speak' };
  }

  snapshot(_tick: number): NormalTestToxicitySnapshot {
    return {
      drugWithheldAtTick: this.withheldAt, exclusionsRecordedAtTick: this.exclusionsAt,
      toxicityRecordedAtTick: this.toxicityAt, escalationAtTick: this.escalationAt,
      supportiveIntentAtTick: this.supportiveIntentAt, boundariesReviewedAtTick: this.boundariesAt,
      cycleNumber: 1, dayOfCycle: 9,
      // The pre-treatment panel is wild type in every state, and the supply stays with the
      // patient. Those two facts together are the whole lesson.
      genotypePanelWildType: true,
      supplyHeldByPatient: true,
      nextDoseDue: this.nextDoseDue,
      nextDoseTaken: this.nextDoseTaken,
      serviceResponded: this.serviceResponded,
      serviceObserved: this.serviceObserved,
      testExclusionAttempted: this.testExclusionAttempted,
      waitForServiceAttempted: this.waitAttempted,
      doseAdviceAttempted: this.doseAdviceAttempted,
      symptomaticOnlyAttempted: this.symptomaticAttempted,
      observationRecord: this.observationRecord ? { ...this.observationRecord } : null,
      treatmentRecord: this.treatmentRecord ? { ...this.treatmentRecord } : null,
      observation: this.observation ? { ...this.observation } : null, alertness: this.vitals().alertness,
      choiceFeedback: this.feedback, ended: this.ended,
      authoredStateTransitions: true, doseModelAvailable: false, durableRecoveryProven: false,
    };
  }
}
