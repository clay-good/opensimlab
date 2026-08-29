import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { RARE_EARLY_MYOCARDITIS_A_BASE_RATE_IS_NOT_A_THRESHOLD as SCENARIO } from '../../src/modules/oncology/scenarios/rare-early-myocarditis-a-base-rate-is-not-a-threshold';
import { RARE_EARLY_MYOCARDITIS_FIXTURES as FIXTURES } from '../../src/modules/oncology/rare-early-myocarditis-fixtures';
import { RareEarlyMyocarditis } from '../../src/modules/oncology/rare-early-myocarditis';
import { RARE_EARLY_MYOCARDITIS_RHYTHM_TICKS as RHYTHM, RARE_EARLY_MYOCARDITIS_TEAM_TICKS as TEAMS, RARE_EARLY_MYOCARDITIS_TAKEOVER_TICKS as STOP, RARE_EARLY_MYOCARDITIS_ACTIONS, type RareEarlyMyocarditisAction } from '../../src/modules/oncology/rare-early-myocarditis';

type Choices = readonly (readonly [number, RareEarlyMyocarditisAction])[];

function drive(actions: Choices, until: number) {
  const model = new RareEarlyMyocarditis();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology checkpoint-myocarditis contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // He must look well throughout. A deterioration would decide the threshold for the learner.
  it('holds the interval, the troponin and the patient constant', () => {
    for (const until of [10, RHYTHM + 10, TEAMS + 10, STOP - 10]) {
      const run = drive([[0, 'check-the-supplied-results']], until);
      expect(run.snapshot.weeksSinceStart).toBe(4);
      expect(run.snapshot.cyclesGiven).toBe(2);
      expect(run.snapshot.troponinMarkedlyRaised).toBe(true);
      expect(run.model.vitals()).toEqual(new RareEarlyMyocarditis().vitals());
    }
  });

  // The central mechanic: conduction is only observed where somebody arranged to observe it.
  it('progresses the conduction only where monitoring was arranged', () => {
    const unmonitored = drive([[0, 'record-the-exposure-interval']], RHYTHM + 6000);
    expect(unmonitored.ids).not.toContain('conduction-progressed');
    expect(unmonitored.snapshot.conductionProgressed).toBe(false);
    expect(unmonitored.snapshot.monitored).toBe(false);

    const monitored = drive([[0, 'arrange-continuous-rhythm-monitoring']], RHYTHM + 10);
    expect(monitored.ids).toContain('conduction-progressed');
    expect(monitored.snapshot.conductionProgressed).toBe(true);
    expect(monitored.snapshot.monitored).toBe(true);
  });

  it('times the conduction change from when monitoring started, not from the run', () => {
    const late = drive([[RHYTHM, 'arrange-continuous-rhythm-monitoring']], RHYTHM + 10);
    expect(late.ids).not.toContain('conduction-progressed');
    const later = drive([[RHYTHM, 'arrange-continuous-rhythm-monitoring']], RHYTHM * 2 + 10);
    expect(later.ids).toContain('conduction-progressed');
  });

  it('records the interval as a finding rather than as background', () => {
    const text = drive([[0, 'record-the-exposure-interval']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('median of 4 weeks');
    expect(text).toContain('not a coincidence to be noted afterwards');
  });

  it('keeps the shoulders in the record and says why', () => {
    const text = drive([[0, 'record-what-is-present-that-is-not-cardiac']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('aching and weak shoulders');
    expect(text).toContain('predictors of cardiotoxicity-related death');
  });

  it('refuses the four shortcuts, including stopping at the coronary pathway', () => {
    const rarity = drive([[0, 'it-is-too-rare-to-be-that']], 10);
    expect(rarity.ids).toContain('rarity-refused');
    expect(rarity.snapshot.choiceFeedback).toContain('the consequence and the window set your threshold');
    const troponin = drive([[0, 'the-troponin-is-raised-in-lots-of-things']], 10);
    expect(troponin.ids).toContain('troponin-refused');
    expect(troponin.snapshot.choiceFeedback).toContain('the company it keeps is');
    const defer = drive([[0, 'repeat-the-troponin-in-a-week']], 10);
    expect(defer.ids).toContain('defer-refused');
    expect(defer.snapshot.choiceFeedback).toContain('a plan to find out afterwards');
    const coronary = drive([[0, 'treat-it-as-a-coronary-syndrome-and-stop-there']], 10);
    expect(coronary.ids).toContain('coronary-only-refused');
    expect(coronary.snapshot.choiceFeedback).toContain('not for considering it, which is reasonable, but for stopping');
  });

  it('states the two numbers as answering different questions', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('0.1 to 1 percent');
    expect(text).toContain('52 of 131 reported cases');
    expect(text).toContain('doing different jobs');
    expect(text).toContain('Nothing here estimates a probability for this man');
  });

  it('never sends teams that nobody contacted', () => {
    const idle = drive([[0, 'arrange-continuous-rhythm-monitoring']], TEAMS + 6000);
    expect(idle.ids).not.toContain('teams-responded');
    const called = drive([[0, 'escalate-to-both-teams']], TEAMS + 10);
    expect(called.ids).toContain('teams-responded');
  });

  it('gates handoff on a current assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-exposure-interval'], [1, 'record-what-is-present-that-is-not-cardiac'],
      [2, 'arrange-continuous-rhythm-monitoring'], [3, 'escalate-to-both-teams'],
      [4, 'record-bounded-treatment-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [TEAMS + 20, 'handoff']];
    expect(drive(stale, TEAMS + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 36020);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.teamsObserved).toBe(true);
    expect(done.snapshot.conductionProgressed).toBe(true);
    expect(done.snapshot.choiceFeedback).toContain('conduction has already moved once while he was watched');
    const recovered = drive(FIXTURES.recovery, 36030);
    expect(recovered.snapshot.rarityDismissalAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'record-the-exposure-interval'], [RHYTHM + 20, 'record-the-exposure-interval']], RHYTHM + 30);
    expect(twice.ids.filter((id) => id === 'interval-recorded')).toHaveLength(1);
    expect(twice.snapshot.intervalRecordedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover and never invents a conduction change', () => {
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('instructor-takeover');
    expect(run.ids).not.toContain('conduction-progressed');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'methylprednisolone', doseMg: 1000 } });
    engine.apply({ tick: 0, type: 'laboratory-tls-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'rare-early-myocarditis-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'rare-early-myocarditis-response', payload: { action: 'give-steroids' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('rare-early-myocarditis-generic-action-refused');
    expect(ids).toContain('rare-early-myocarditis-action-refused');
    expect(frame.equipment.resuscitation.rareEarlyMyocarditis!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['methylprednisolone', 'prednisolone', 'infliximab', 'abatacept', 'aspirin',
      'mg/kg', 'milligram'];
    for (const action of RARE_EARLY_MYOCARDITIS_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'rare-early-myocarditis-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.rareEarlyMyocarditis!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(RARE_EARLY_MYOCARDITIS_ACTIONS).size).toBe(RARE_EARLY_MYOCARDITIS_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
