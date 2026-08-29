import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { INCIDENTAL_CLOT_A_DECISION_THE_EVIDENCE_CANNOT_MAKE as SCENARIO } from '../../src/modules/oncology/scenarios/incidental-clot-a-decision-the-evidence-cannot-make';
import { INCIDENTAL_CLOT_FIXTURES as FIXTURES } from '../../src/modules/oncology/incidental-clot-fixtures';
import { IncidentalClot, INCIDENTAL_CLOT_QUESTION_TICKS as QUESTION,
  INCIDENTAL_CLOT_SERVICE_TICKS as SERVICE, INCIDENTAL_CLOT_TAKEOVER_TICKS as STOP,
  INCIDENTAL_CLOT_ACTIONS, type IncidentalClotAction } from '../../src/modules/oncology/incidental-clot';

type Choices = readonly (readonly [number, IncidentalClotAction])[];

function drive(actions: Choices, until: number) {
  const model = new IncidentalClot();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Oncology incidental-clot contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'oncology', 'clinic', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The lesson only works while the recommendation stays conditional and the evidence stays very
  // low. If either hardened, one of the two refused reflexes would become the right answer.
  it('never lets the recommendation harden or the certainty improve', () => {
    for (const until of [10, QUESTION + 10, SERVICE + 10, STOP - 10]) {
      const run = drive([[0, 'record-the-certainty-of-the-recommendation']], until);
      expect(run.snapshot.recommendationIsConditional).toBe(true);
      expect(run.snapshot.certaintyOfEvidence).toBe('very low');
    }
  });

  it('records incidental as a route to the finding, not a property of the clot', () => {
    const text = drive([[0, 'record-the-finding-and-how-it-was-found']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('not because anyone suspected an embolus');
    expect(text).toContain('It says nothing about the clot');
  });

  it('states the conditional strength and the absent trial evidence together', () => {
    const text = drive([[0, 'record-the-certainty-of-the-recommendation']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('conditional recommendation on very low certainty');
    expect(text).toContain('no systematic review and no randomised trial');
    expect(text).toContain('instruction to decide with the patient');
  });

  it('never records a benefit figure without its harm', () => {
    const text = drive([[0, 'record-the-benefit-and-the-harm-together']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('89 fewer deaths per 1000');
    expect(text).toContain('128 more major bleeds per 1000');
    // The registry counterweight is not optional: it is the reason this is a decision.
    expect(text).toContain('the rate of major bleeding exceeded the rate of symptomatic pulmonary embolism');
  });

  it('refuses both reflexes, in opposite directions, for stated reasons', () => {
    const dismissal = drive([[0, 'incidental-so-no-action-needed']], 10);
    expect(dismissal.ids).toContain('dismissal-refused');
    expect(dismissal.snapshot.choiceFeedback).toContain('doing nothing is one of the two options');
    const reflex = drive([[0, 'a-pe-is-a-pe-so-anticoagulate-now']], 10);
    expect(reflex.ids).toContain('reflex-refused');
    expect(reflex.snapshot.choiceFeedback).toContain('belonging to the qualified team');
    const wait = drive([[0, 'wait-for-symptoms-before-deciding']], 10);
    expect(wait.ids).toContain('wait-refused');
    expect(wait.snapshot.choiceFeedback).toContain('drifting into it is not the same thing');
    const defer = drive([[0, 'leave-it-for-the-clinic-letter']], 10);
    expect(defer.ids).toContain('defer-refused');
    expect(defer.snapshot.choiceFeedback).toContain('four days');
  });

  it('never sends a treating service that nobody contacted', () => {
    const idle = drive([[0, 'record-the-finding-and-how-it-was-found']], SERVICE + 6000);
    expect(idle.ids).not.toContain('service-responded');
    const called = drive([[0, 'escalate-to-the-treating-service']], SERVICE + 10);
    expect(called.ids).toContain('service-responded');
    expect(called.snapshot.serviceResponded).toBe(true);
  });

  it('lets the patient raise the values question himself, without deteriorating', () => {
    const run = drive([[0, 'record-the-finding-and-how-it-was-found']], QUESTION + 10);
    expect(run.ids).toContain('patient-question');
    expect(run.snapshot.patientAsked).toBe(true);
    expect(run.model.vitals()).toEqual(new IncidentalClot().vitals());
  });

  it('reaches no agreement even on the complete path', () => {
    const shared = drive([[0, 'record-the-decision-as-shared']], 10);
    expect(shared.snapshot.choiceFeedback).toContain('No agreement is recorded here, because none has been reached');
    const done = drive(FIXTURES.expert, 54040);
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.choiceFeedback).not.toContain('agreed');
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-the-finding-and-how-it-was-found'], [1, 'record-the-certainty-of-the-recommendation'],
      [2, 'record-the-benefit-and-the-harm-together'], [3, 'record-this-patients-bleeding-risk'],
      [4, 'escalate-to-the-treating-service'], [5, 'record-the-decision-as-shared'],
      [6, 'review-boundaries'], [7, 'reassess'], [SERVICE + 20, 'handoff']];
    expect(drive(stale, SERVICE + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 54040);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.serviceObserved).toBe(true);
    const recovered = drive(FIXTURES.recovery, 54050);
    expect(recovered.snapshot.dismissalAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('treats a repeated recording action as a no-op', () => {
    const twice = drive([[0, 'record-this-patients-bleeding-risk'], [QUESTION + 20, 'record-this-patients-bleeding-risk']], QUESTION + 30);
    expect(twice.ids.filter((id) => id === 'bleeding-risk-recorded')).toHaveLength(1);
    expect(twice.snapshot.bleedingRiskRecordedAtTick).toBe(0);
  });

  it('bounds an abandoned run with takeover', () => {
    expect(QUESTION).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('patient-question');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent lessons', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'enoxaparin', doseMg: 100 } });
    engine.apply({ tick: 0, type: 'delayed-immune-event-response', payload: { action: 'review-boundaries' } });
    engine.apply({ tick: 0, type: 'incidental-clot-response', payload: { action: 'review-boundaries', extra: 1 } });
    engine.apply({ tick: 0, type: 'incidental-clot-response', payload: { action: 'start-anticoagulation' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('incidental-clot-generic-action-refused');
    expect(ids).toContain('incidental-clot-action-refused');
    expect(frame.equipment.resuscitation.incidentalClot!.boundariesReviewedAtTick).toBeNull();
  });

  it('names no agent or dose after ANY action', () => {
    const forbidden = ['enoxaparin', 'dalteparin', 'tinzaparin', 'apixaban', 'rivaroxaban', 'edoxaban',
      'warfarin', 'heparin', 'mg/kg', 'milligram'];
    for (const action of INCIDENTAL_CLOT_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'incidental-clot-response', payload: { action } });
      const serialized = JSON.stringify(engine.step().equipment.resuscitation.incidentalClot!).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(INCIDENTAL_CLOT_ACTIONS).size).toBe(INCIDENTAL_CLOT_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
