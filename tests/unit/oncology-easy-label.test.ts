import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { EASY_LABEL_A_LABEL_THAT_FITS_TOO_EASILY as SCENARIO } from '../../src/modules/oncology/scenarios/easy-label-a-label-that-fits-too-easily';
import { EASY_LABEL_FIXTURES as FIXTURES } from '../../src/modules/oncology/easy-label-fixtures';
import { EasyLabel } from '../../src/modules/oncology/easy-label';
import { EASY_LABEL_HISTORY_TICKS as HISTORY, EASY_LABEL_TEAM_TICKS as TEAM, EASY_LABEL_TAKEOVER_TICKS as STOP, EASY_LABEL_ACTIONS, type EasyLabelAction } from '../../src/modules/oncology/easy-label';

type Choices = readonly (readonly [number, EasyLabelAction])[];

function drive(actions: Choices, until: number) {
  const model = new EasyLabel();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology diagnosis-of-exclusion contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The exclusion never happens in this fixture, in any state. Only escalation moves.
  it('never excludes the competing causes and never produces a distinguishing finding', () => {
    for (const until of [10, HISTORY + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-observations'], [1, 'check-the-supplied-results']], until);
      expect(run.snapshot.competingCausesExcluded).toBe(false);
      expect(run.snapshot.resultRecord!.microbiologyReported).toBe(false);
      expect(run.snapshot.observationRecord!.bloodInStool).toBe(false);
      expect(run.snapshot.observationRecord!.coreTemperatureC).toBe(36.8);
    }
  });

  it('strengthens the competing cause without changing the patient', () => {
    const before = drive([[0, 'check-the-supplied-results'], [1, 'check-observations']], 10);
    expect(before.snapshot.resultRecord!.recentAntibiotics).toBe(false);

    const after = drive([[HISTORY + 10, 'check-the-supplied-results'], [HISTORY + 11, 'check-observations']], HISTORY + 20);
    expect(after.ids).toContain('history-surfaces');
    expect(after.snapshot.resultRecord!.recentAntibiotics).toBe(true);
    expect(after.snapshot.observationRecord).toEqual({
      ...before.snapshot.observationRecord!, atTick: HISTORY + 11,
    });
  });

  it('records the exclusion requirement as the definition rather than a caution', () => {
    const text = drive([[0, 'record-that-the-label-is-a-diagnosis-of-exclusion']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('indistinguishable from it');
    expect(text).toContain('It is the definition of the diagnosis');
    expect(text).toContain('has not been made until the exclusion has happened');
  });

  it('records the open questions, and names the antibiotics once they surface', () => {
    const early = drive([[0, 'record-what-has-not-been-excluded']], 10).snapshot.choiceFeedback!;
    expect(early).toContain('no microbiological studies have been reported');
    expect(early).not.toContain('recent antibiotics');
    const late = drive([[HISTORY + 10, 'record-what-has-not-been-excluded']], HISTORY + 20).snapshot.choiceFeedback!;
    expect(late).toContain('recent antibiotics and a recent admission');
  });

  it('refuses treating first and waiting as two different errors', () => {
    const treat = drive([[0, 'start-immunosuppression-now-it-is-obviously-colitis']], 10);
    expect(treat.ids).toContain('immunosuppression-refused');
    expect(treat.snapshot.choiceFeedback).toContain('makes the competing one worse');
    expect(treat.snapshot.choiceFeedback).toContain('not the ordinary cost of being wrong');
    const wait = drive([[0, 'wait-for-every-result-before-telling-anyone']], 10);
    expect(wait.ids).toContain('wait-refused');
    expect(wait.snapshot.choiceFeedback).toContain('delay is not the free option it feels like');
    expect(wait.snapshot.choiceFeedback).toContain('not competing for the same minutes');
    const fever = drive([[0, 'no-fever-so-it-cannot-be-infection']], 10);
    expect(fever.ids).toContain('no-fever-refused');
    expect(fever.snapshot.choiceFeedback).toContain('microbiological rather than clinical');
    const cycles = drive([[0, 'four-cycles-in-so-it-is-the-drug']], 10);
    expect(cycles.ids).toContain('four-cycles-refused');
    expect(cycles.snapshot.choiceFeedback).toContain('makes the label available. It does not make it correct');
  });

  it('holds both boundaries rather than resolving them into one rule', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('grade 2 or higher, so treating is genuinely indicated');
    expect(text).toContain('increased risk of infectious colitis');
    expect(text).toContain('Neither half can be dropped');
    expect(text).toContain('only one of the two decisions has to wait for a result');
  });

  it('never sends a team that nobody called', () => {
    const idle = drive([[0, 'record-that-the-label-is-a-diagnosis-of-exclusion']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const called = drive([[0, 'escalate-so-both-can-start-together']], TEAM + 10);
    expect(called.ids).toContain('team-responded');
  });

  it('gates handoff on an assessment taken after the history, and recovers', () => {
    const stale: Choices = [[0, 'record-that-the-label-is-a-diagnosis-of-exclusion'],
      [1, 'record-what-has-not-been-excluded'], [2, 'escalate-so-both-can-start-together'],
      [3, 'record-bounded-treatment-intent'], [4, 'review-boundaries'], [5, 'reassess'],
      [TEAM + 20, 'handoff']];
    expect(drive(stale, TEAM + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 40030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    expect(done.snapshot.historySurfaced).toBe(true);
    expect(done.snapshot.choiceFeedback).toContain('the exclusion has not happened');
    const recovered = drive(FIXTURES.recovery, 40040);
    expect(recovered.snapshot.immunosuppressionAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
    expect(recovered.snapshot.choiceFeedback).toContain('treating first was considered and not taken');
  });

  it('bounds an abandoned run sooner than every other lesson in this module', () => {
    expect(STOP).toBe(90 * 60 * 10);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('history-surfaces');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'methylprednisolone', doseMg: 60 } });
    engine.apply({ tick: 0, type: 'silent-interaction-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'easy-label-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'easy-label-response', payload: { action: 'give-steroids' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('easy-label-generic-action-refused');
    expect(ids).toContain('easy-label-action-refused');
    expect(frame.equipment.resuscitation.easyLabel!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['prednisolone', 'methylprednisolone', 'infliximab', 'vedolizumab',
      'budesonide', 'mg/kg', 'milligram'];
    for (const action of EASY_LABEL_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'easy-label-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.easyLabel!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(EASY_LABEL_ACTIONS).size).toBe(EASY_LABEL_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
