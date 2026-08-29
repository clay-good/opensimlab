import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { NORMAL_TEST_TOXICITY_THE_DOSE_IN_HIS_BAG as SCENARIO } from '../../src/modules/oncology/scenarios/normal-test-toxicity-the-dose-in-his-bag';
import { NORMAL_TEST_TOXICITY_FIXTURES as FIXTURES } from '../../src/modules/oncology/normal-test-toxicity-fixtures';
import { NormalTestToxicity } from '../../src/modules/oncology/normal-test-toxicity';
import { NORMAL_TEST_TOXICITY_NEXT_DOSE_TICKS as NEXT_DOSE, NORMAL_TEST_TOXICITY_SERVICE_TICKS as SERVICE, NORMAL_TEST_TOXICITY_TAKEOVER_TICKS as STOP, NORMAL_TEST_TOXICITY_ACTIONS, type NormalTestToxicityAction } from '../../src/modules/oncology/normal-test-toxicity';

type Choices = readonly (readonly [number, NormalTestToxicityAction])[];

function drive(actions: Choices, until: number) {
  const model = new NormalTestToxicity();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology oral-anticancer-toxicity contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The whole lesson rests on the panel being normal and the tablets being his. Neither may drift.
  it('keeps the panel wild type and the supply with the patient in every state', () => {
    for (const until of [10, NEXT_DOSE + 10, SERVICE + 10, STOP - 10]) {
      const run = drive([[0, 'check-the-treatment-record']], until);
      expect(run.snapshot.genotypePanelWildType).toBe(true);
      expect(run.snapshot.supplyHeldByPatient).toBe(true);
      expect(run.snapshot.treatmentRecord!.suppliedToPatient).toBe(true);
      expect(run.snapshot.treatmentRecord!.dayOfCycle).toBe(9);
    }
  });

  // This is the one lesson in the module where inaction has a consequence in the fixture.
  it('lets the evening dose be taken if and only if the drug was not withheld', () => {
    const idle = drive([[0, 'record-the-toxicity-and-its-severity']], NEXT_DOSE + 10);
    expect(idle.ids).toContain('next-dose-taken');
    expect(idle.snapshot.nextDoseTaken).toBe(true);
    const stopped = drive([[0, 'withhold-the-drug-now']], NEXT_DOSE + 10);
    expect(stopped.ids).toContain('next-dose-withheld');
    expect(stopped.snapshot.nextDoseTaken).toBe(false);
    expect(stopped.snapshot.treatmentRecord).toBeNull();
  });

  it('states withholding as reversible and needing nobody’s permission', () => {
    const text = drive([[0, 'withhold-the-drug-now']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('does not need anyone else’s permission');
    expect(text).toContain('reversible if the treating team disagrees');
  });

  it('records what a wild-type panel does not exclude, with the cohort figures', () => {
    const text = drive([[0, 'record-what-the-normal-test-does-not-exclude']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('23 percent of the wild-type patients');
    expect(text).toContain('39 percent of variant carriers');
    expect(text).toContain('It does not clear the rest');
  });

  it('refuses the four shortcuts with stated reasons', () => {
    const test = drive([[0, 'the-test-was-normal-so-not-the-drug']], 10);
    expect(test.ids).toContain('test-exclusion-refused');
    expect(test.snapshot.choiceFeedback).toContain('an exclusion test it was never able to be');
    const wait = drive([[0, 'wait-for-oncology-before-stopping']], 10);
    expect(wait.ids).toContain('wait-refused');
    expect(wait.snapshot.choiceFeedback).toContain('only one of them is in this room');
    const dose = drive([[0, 'advise-him-to-halve-the-dose']], 10);
    expect(dose.ids).toContain('dose-advice-refused');
    expect(dose.snapshot.choiceFeedback).toContain('while appearing to be an action');
    const symptomatic = drive([[0, 'treat-the-symptoms-and-review-tomorrow']], 10);
    expect(symptomatic.ids).toContain('symptomatic-refused');
    expect(symptomatic.snapshot.choiceFeedback).toContain('leaves the cause running');
  });

  it('never sends a service that nobody contacted', () => {
    const idle = drive([[0, 'withhold-the-drug-now']], SERVICE + 6000);
    expect(idle.ids).not.toContain('service-responded');
    const called = drive([[0, 'escalate-to-acute-oncology']], SERVICE + 10);
    expect(called.ids).toContain('service-responded');
  });

  it('names the cost of a deferred decision when escalation preceded withholding', () => {
    const late = drive([[0, 'escalate-to-acute-oncology'], [NEXT_DOSE + 10, 'withhold-the-drug-now']], NEXT_DOSE + 20);
    expect(late.ids).toContain('next-dose-taken');
    expect(late.snapshot.choiceFeedback).toContain('which is what deferring this cost');
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'withhold-the-drug-now'], [1, 'record-the-toxicity-and-its-severity'],
      [2, 'record-what-the-normal-test-does-not-exclude'], [3, 'escalate-to-acute-oncology'],
      [4, 'record-bounded-supportive-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [SERVICE + 20, 'handoff']];
    expect(drive(stale, SERVICE + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 42040);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.serviceObserved).toBe(true);
    expect(done.snapshot.nextDoseTaken).toBe(false);
    const recovered = drive(FIXTURES.recovery, 42050);
    expect(recovered.snapshot.testExclusionAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('carries a taken dose into the handoff rather than tidying it away', () => {
    const late: Choices = [[NEXT_DOSE + 10, 'withhold-the-drug-now'], [NEXT_DOSE + 11, 'record-the-toxicity-and-its-severity'],
      [NEXT_DOSE + 12, 'record-what-the-normal-test-does-not-exclude'], [NEXT_DOSE + 13, 'escalate-to-acute-oncology'],
      [NEXT_DOSE + 14, 'record-bounded-supportive-intent'], [NEXT_DOSE + 15, 'review-boundaries'],
      [NEXT_DOSE + 16, 'reassess'], [NEXT_DOSE + 17, 'handoff']];
    const run = drive(late, NEXT_DOSE + 20);
    expect(run.snapshot.ended).toBe('handoff');
    expect(run.snapshot.choiceFeedback).toContain('a further dose was taken before it was stopped');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'withhold-the-drug-now'], [NEXT_DOSE + 20, 'withhold-the-drug-now']], NEXT_DOSE + 30);
    expect(twice.ids.filter((id) => id === 'drug-withheld')).toHaveLength(1);
    expect(twice.snapshot.drugWithheldAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    expect(NEXT_DOSE).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('next-dose-taken');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'ondansetron', doseMg: 8 } });
    engine.apply({ tick: 0, type: 'incidental-clot-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'normal-test-toxicity-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'normal-test-toxicity-response', payload: { action: 'give-uridine' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('normal-test-toxicity-generic-action-refused');
    expect(ids).toContain('normal-test-toxicity-action-refused');
    expect(frame.equipment.resuscitation.normalTestToxicity!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['capecitabine', 'fluorouracil', 'uridine', 'loperamide', 'ondansetron',
      'mg/kg', 'milligram'];
    for (const action of NORMAL_TEST_TOXICITY_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'normal-test-toxicity-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.normalTestToxicity!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(NORMAL_TEST_TOXICITY_ACTIONS).size).toBe(NORMAL_TEST_TOXICITY_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
