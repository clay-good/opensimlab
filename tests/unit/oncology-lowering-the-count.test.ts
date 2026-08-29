import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { LOWERING_THE_COUNT_A_NUMBER_THAT_CAN_BE_MOVED as SCENARIO } from '../../src/modules/oncology/scenarios/lowering-the-count-a-number-that-can-be-moved';
import { LOWERING_THE_COUNT_FIXTURES as FIXTURES } from '../../src/modules/oncology/lowering-the-count-fixtures';
import { LoweringTheCount } from '../../src/modules/oncology/lowering-the-count';
import { LOWERING_THE_COUNT_DETERIORATION_TICKS as WORSE, LOWERING_THE_COUNT_TEAM_TICKS as TEAM, LOWERING_THE_COUNT_TAKEOVER_TICKS as STOP, LOWERING_THE_COUNT_ACTIONS, type LoweringTheCountAction } from '../../src/modules/oncology/lowering-the-count';

type Choices = readonly (readonly [number, LoweringTheCountAction])[];

function drive(actions: Choices, until: number) {
  const model = new LoweringTheCount();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology hyperleukocytosis contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The supplied count is one sample and cannot move. The patient can, and does.
  it('deteriorates the patient while the supplied count stays exactly where it is', () => {
    const before = drive([[0, 'check-the-supplied-results']], 10);
    expect(before.snapshot.whiteCellCount).toBe(240);
    expect(before.snapshot.clinicallyWorse).toBe(false);

    const after = drive([[WORSE + 10, 'check-the-supplied-results']], WORSE + 20);
    expect(after.ids).toContain('clinically-worse');
    expect(after.snapshot.whiteCellCount).toBe(240);
    expect(after.snapshot.resultRecord!.whiteCellCount).toBe(240);
    // What deteriorates is what was already abnormal.
    expect(after.snapshot.observationRecord).toBeNull();
    const observed = drive([[WORSE + 10, 'check-observations']], WORSE + 20);
    expect(observed.snapshot.observationRecord!.respiratoryRateBpm).toBe(32);
    expect(observed.snapshot.observationRecord!.spo2Percent).toBe(89);
  });

  it('keeps leukostasis a clinical designation in every state', () => {
    for (const until of [10, WORSE + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-the-supplied-results']], until);
      expect(run.snapshot.leukostasisIsClinical).toBe(true);
      expect(run.snapshot.resultRecord!.marrowAvailable).toBe(false);
    }
  });

  it('records the findings that make it leukostasis, not the number', () => {
    const text = drive([[0, 'record-the-clinical-picture-not-the-count']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('breathlessness at rest and confusion');
    expect(text).toContain('it is not the thing being described');
  });

  it('separates the urgency the count licenses from the manoeuvre it does not', () => {
    const text = drive([[0, 'record-what-the-count-does-and-does-not-license']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('the optimal strategy is unknown');
    expect(text).toContain('no standardised guidelines');
    expect(text).toContain('licenses urgency and it does not select a manoeuvre');
  });

  it('refuses the four shortcuts, apheresis for the standing down rather than the route', () => {
    const apheresis = drive([[0, 'send-him-for-apheresis-and-stand-down']], 10);
    expect(apheresis.ids).toContain('apheresis-refused');
    expect(apheresis.snapshot.choiceFeedback).toContain('the refusal is about the standing down');
    expect(apheresis.snapshot.choiceFeedback).toContain('0.69 to 1.13');
    const countOnly = drive([[0, 'the-count-alone-makes-the-diagnosis']], 10);
    expect(countOnly.ids).toContain('count-only-refused');
    expect(countOnly.snapshot.choiceFeedback).toContain('a clinical designation');
    const wait = drive([[0, 'wait-for-the-marrow-before-calling']], 10);
    expect(wait.ids).toContain('wait-refused');
    expect(wait.snapshot.choiceFeedback).toContain('changes who is certain, not what needs to happen next');
    const delirium = drive([[0, 'treat-the-confusion-as-delirium']], 10);
    expect(delirium.ids).toContain('delirium-refused');
    expect(delirium.snapshot.choiceFeedback).toContain('removes the very thing that made the diagnosis');
  });

  // The boundary review must not collapse into either wrong reading of the interval.
  it('reads the confidence interval in both directions', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('includes benefit as well as harm');
    expect(text).toContain('the sicker patients got it');
    expect(text).toContain('not evidence that lowering the count is useless');
  });

  it('never sends a team that nobody called', () => {
    const idle = drive([[0, 'record-the-clinical-picture-not-the-count']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const called = drive([[0, 'escalate-to-haematology-now']], TEAM + 10);
    expect(called.ids).toContain('team-responded');
  });

  it('gates handoff on a current assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-clinical-picture-not-the-count'], [1, 'escalate-to-haematology-now'],
      [2, 'record-what-the-count-does-and-does-not-license'], [3, 'record-bounded-cytoreduction-intent'],
      [4, 'review-boundaries'], [5, 'reassess'], [TEAM + 20, 'handoff']];
    expect(drive(stale, TEAM + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 24020);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    expect(done.snapshot.clinicallyWorse).toBe(true);
    expect(done.snapshot.choiceFeedback).toContain('he deteriorated in both while this was being arranged');
    const recovered = drive(FIXTURES.recovery, 24030);
    expect(recovered.snapshot.apheresisStandDownAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run sooner than this module’s other lessons', () => {
    expect(STOP).toBeLessThan(180 * 60 * 10);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('clinically-worse');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'hydroxycarbamide', doseMg: 1000 } });
    engine.apply({ tick: 0, type: 'rare-early-myocarditis-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'lowering-the-count-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'lowering-the-count-response', payload: { action: 'start-apheresis' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('lowering-the-count-generic-action-refused');
    expect(ids).toContain('lowering-the-count-action-refused');
    expect(frame.equipment.resuscitation.loweringTheCount!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['hydroxycarbamide', 'hydroxyurea', 'cytarabine', 'rasburicase', 'allopurinol',
      'mg/kg', 'milligram'];
    for (const action of LOWERING_THE_COUNT_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'lowering-the-count-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.loweringTheCount!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(LOWERING_THE_COUNT_ACTIONS).size).toBe(LOWERING_THE_COUNT_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
