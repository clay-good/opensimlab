import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { LABORATORY_TLS_A_SYNDROME_HE_DOES_NOT_HAVE_YET as SCENARIO } from '../../src/modules/oncology/scenarios/laboratory-tls-a-syndrome-he-does-not-have-yet';
import { LABORATORY_TLS_FIXTURES as FIXTURES } from '../../src/modules/oncology/laboratory-tls-fixtures';
import { LaboratoryTls, LABORATORY_TLS_REPEAT_TICKS as REPEAT,
  LABORATORY_TLS_TEAM_TICKS as TEAM, LABORATORY_TLS_TAKEOVER_TICKS as STOP,
  LABORATORY_TLS_ACTIONS, type LaboratoryTlsAction } from '../../src/modules/oncology/laboratory-tls';

type Choices = readonly (readonly [number, LaboratoryTlsAction])[];

function drive(actions: Choices, until: number) {
  const model = new LaboratoryTls();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology laboratory tumour-lysis contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The gap is the lesson. If the clinical criteria were ever met, the definition would settle
  // itself and one of the two refused readings would become correct.
  it('holds the laboratory criteria met and the clinical criteria unmet in every state', () => {
    for (const until of [10, REPEAT + 10, TEAM + 10, STOP - 10]) {
      const run = drive([[0, 'check-the-bloods']], until);
      expect(run.snapshot.laboratoryCriteriaMet).toBe(true);
      expect(run.snapshot.clinicalCriteriaMet).toBe(false);
      expect(run.snapshot.bloodRecord!.creatinineUnchanged).toBe(true);
      expect(run.model.vitals()).toEqual(new LaboratoryTls().vitals());
    }
  });

  it('records which definition is met, with what the other one requires', () => {
    const text = drive([[0, 'record-which-definition-is-met']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('the laboratory criteria are met, the clinical criteria are not');
    expect(text).toContain('life-threatening arrhythmia');
    expect(text).toContain('loses exactly the thing the next reader needs');
  });

  it('ties what crossed to how long after treatment', () => {
    const text = drive([[0, 'record-what-crossed-and-when']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('18 hours after the first cycle');
    expect(text).toContain('early in a window rather than late in an event');
  });

  it('moves the bloods without moving the patient', () => {
    const run = drive([[0, 'record-which-definition-is-met'], [REPEAT + 10, 'check-the-bloods']], REPEAT + 20);
    expect(run.ids).toContain('repeat-returned');
    expect(run.snapshot.repeatReturned).toBe(true);
    expect(run.snapshot.bloodRecord!.risingSet).toBe(true);
    expect(run.snapshot.bloodRecord!.hoursAfterTreatment).toBe(19);
    expect(run.snapshot.clinicalCriteriaMet).toBe(false);
  });

  it('refuses both readings the ward is stuck between, in opposite directions', () => {
    const dismissal = drive([[0, 'he-is-well-so-it-is-just-numbers']], 10);
    expect(dismissal.ids).toContain('dismissal-refused');
    expect(dismissal.snapshot.choiceFeedback).toContain('the expected appearance of the thing being watched for');
    const overcall = drive([[0, 'call-it-tumour-lysis-and-move-him-to-intensive-care']], 10);
    expect(overcall.ids).toContain('overcall-refused');
    expect(overcall.snapshot.choiceFeedback).toContain('only 6 percent of patients reached the clinical definition');
    const wait = drive([[0, 'wait-for-the-next-set-before-telling-anyone']], 10);
    expect(wait.ids).toContain('wait-refused');
    expect(wait.snapshot.choiceFeedback).toContain('defers the decision to the thing the decision was supposed to determine');
    const standDown = drive([[0, 'treat-the-potassium-and-stand-down']], 10);
    expect(standDown.ids).toContain('stand-down-refused');
    expect(standDown.snapshot.choiceFeedback).toContain('becomes a clinical one unobserved');
  });

  // The boundary review must name the disagreement, including the review that restates a primary.
  it('states the published rates as disagreeing, and names the misstatement', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('42 percent and clinical in 6 percent');
    expect(text).toContain('27.8 percent met tumour-lysis criteria');
    expect(text).toContain('which is not what it measured');
    expect(text).toContain('None of these is a probability for this man');
  });

  it('never sends a team that nobody contacted', () => {
    const idle = drive([[0, 'record-which-definition-is-met']], TEAM + 6000);
    expect(idle.ids).not.toContain('team-responded');
    const called = drive([[0, 'escalate-to-the-treating-team']], TEAM + 10);
    expect(called.ids).toContain('team-responded');
    expect(called.snapshot.teamResponded).toBe(true);
  });

  it('gates handoff on a current assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-which-definition-is-met'], [1, 'record-what-crossed-and-when'],
      [2, 'record-the-crossing-risk'], [3, 'escalate-to-the-treating-team'],
      [4, 'record-bounded-monitoring-and-treatment-intent'], [5, 'review-boundaries'], [6, 'reassess'],
      [TEAM + 20, 'handoff']];
    expect(drive(stale, TEAM + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 36030);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.teamObserved).toBe(true);
    expect(done.snapshot.choiceFeedback).toContain('rather than when the next number crosses a line');
    const recovered = drive(FIXTURES.recovery, 36040);
    expect(recovered.snapshot.dismissalAttempted).toBe(true);
    expect(recovered.snapshot.overcallAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'record-which-definition-is-met'], [REPEAT + 20, 'record-which-definition-is-met']], REPEAT + 30);
    expect(twice.ids.filter((id) => id === 'definition-recorded')).toHaveLength(1);
    expect(twice.snapshot.definitionRecordedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    expect(REPEAT).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('repeat-returned');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'rasburicase', doseMg: 15 } });
    engine.apply({ tick: 0, type: 'prognosis-question-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'laboratory-tls-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'laboratory-tls-response', payload: { action: 'start-rasburicase' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('laboratory-tls-generic-action-refused');
    expect(ids).toContain('laboratory-tls-action-refused');
    expect(frame.equipment.resuscitation.laboratoryTls!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['rasburicase', 'allopurinol', 'febuxostat', 'calcium gluconate', 'insulin',
      'mg/kg', 'milligram', 'ml/h'];
    for (const action of LABORATORY_TLS_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'laboratory-tls-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.laboratoryTls!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(LABORATORY_TLS_ACTIONS).size).toBe(LABORATORY_TLS_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
