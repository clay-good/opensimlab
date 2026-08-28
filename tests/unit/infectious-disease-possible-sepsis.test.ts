import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { POSSIBLE_SEPSIS_A_CLOCK_THAT_RUNS_EITHER_WAY as SCENARIO } from '../../src/modules/infectious-disease/scenarios/possible-sepsis-a-clock-that-runs-either-way';
import { POSSIBLE_SEPSIS_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/possible-sepsis-fixtures';
import { PossibleSepsis, POSSIBLE_SEPSIS_INVESTIGATION_TICKS as RETURNS,
  POSSIBLE_SEPSIS_CEILING_TICKS as CEILING, POSSIBLE_SEPSIS_SHOCK_TICKS as SHOCK,
  POSSIBLE_SEPSIS_TAKEOVER_TICKS as STOP, POSSIBLE_SEPSIS_ACTIONS,
  type PossibleSepsisAction } from '../../src/modules/infectious-disease/possible-sepsis';

type Choices = readonly (readonly [number, PossibleSepsisAction])[];

function drive(actions: Choices, until: number) {
  const model = new PossibleSepsis();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Infectious disease possible sepsis contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'infectious-disease', 'emergency-department', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The guardrail this lesson exists for: nothing here lets a learner choose to wait.
  it('exposes no waiting action, and refuses the one that looks like it', () => {
    for (const action of POSSIBLE_SEPSIS_ACTIONS) {
      expect(action).not.toMatch(/^(observe|wait|watch|hold|delay)$/);
    }
    const refused = drive([[0, 'wait-and-see']], 10);
    expect(refused.ids).toContain('wait-refused');
    expect(refused.snapshot.waitAttempted).toBe(true);
    expect(refused.snapshot.assessmentAtTick).toBeNull();
    expect(refused.snapshot.choiceFeedback).toContain('There is no waiting action in this lesson');
  });

  it('runs the ceiling from first suspicion and displays it once recorded', () => {
    const unrecorded = drive([], 600);
    expect(unrecorded.snapshot.ceilingDueInSeconds).toBeNull();
    const recorded = drive([[0, 'record-time-zero']], 600);
    expect(recorded.snapshot.ceilingDueInSeconds).toBe((CEILING - 600) / 10);
    // Recording it later does not buy time: the clock started at first suspicion, not at the record.
    const late = drive([[6000, 'record-time-zero']], 6000);
    expect(late.snapshot.ceilingDueInSeconds).toBe((CEILING - 6000) / 10);
  });

  it('passes the ceiling openly rather than hiding a late intent', () => {
    const late = drive([[0, 'record-time-zero'], [1, 'request-time-limited-assessment'],
      [CEILING + 50, 'record-antimicrobial-intent']], CEILING + 60);
    expect(late.ids).toContain('ceiling-passed');
    expect(late.snapshot.ceilingPassed).toBe(true);
    expect(late.snapshot.ceilingDueInSeconds).toBeNull();
    expect(late.snapshot.antimicrobialInsideCeiling).toBe(false);
    expect(late.snapshot.choiceFeedback).toContain('after the ceiling has passed, which is recorded rather than hidden');
    const inside = drive([[0, 'record-time-zero'], [1, 'request-time-limited-assessment'],
      [RETURNS + 10, 'record-antimicrobial-intent']], RETURNS + 20);
    expect(inside.snapshot.antimicrobialInsideCeiling).toBe(true);
    expect(inside.ids).not.toContain('ceiling-passed');
  });

  it('collapses to the immediate path at shock with no learner discretion', () => {
    const run = drive([[0, 'record-time-zero'], [1, 'request-time-limited-assessment']], SHOCK + 20);
    expect(run.ids).toContain('shock-gate');
    expect(run.ids.indexOf('ceiling-passed')).toBeLessThan(run.ids.indexOf('shock-gate'));
    expect(run.snapshot.immediatePathApplies).toBe(true);
    expect(run.snapshot.perfusionObservation).toBeNull();
    const seen = drive([[0, 'record-time-zero'], [1, 'request-time-limited-assessment'],
      [SHOCK + 20, 'check-perfusion']], SHOCK + 30);
    expect(seen.snapshot.perfusionObservation!.hypotensive).toBe(true);
    expect(seen.snapshot.choiceFeedback).toContain('hypotensive, so the immediate path applies');
    // There is no action that re-opens the time-limited branch once it has collapsed.
    expect(drive([[0, 'record-time-zero'], [SHOCK + 20, 'request-time-limited-assessment']], SHOCK + 30)
      .snapshot.immediatePathApplies).toBe(true);
  });

  it('keeps the learner out of the likelihood classification', () => {
    const run = drive([[0, 'assign-the-tier'], [1, 'record-uncertainty']], 20);
    expect(run.ids).toContain('tier-refused');
    expect(run.snapshot.tierAttempted).toBe(true);
    expect(run.snapshot.choiceFeedback).toContain('classification belongs to the qualified team');
    const serialized = JSON.stringify(run.snapshot);
    for (const tier of ['"possible"', '"probable"', '"definite"', 'assignedTier']) {
      expect(serialized).not.toContain(tier);
    }
  });

  it('refuses a single test as a rule-in or rule-out, and an unbounded deferral', () => {
    const run = drive([[0, 'single-test-rules-out'], [1, 'defer-without-a-ceiling']], 20);
    expect(run.ids).toContain('single-test-refused');
    expect(run.ids).toContain('deferral-refused');
    expect(run.snapshot.singleTestAttempted).toBe(true);
    expect(run.snapshot.deferralAttempted).toBe(true);
    const labs = drive([[0, 'check-labs']], 10).snapshot.choiceFeedback!;
    expect(labs).toContain('No single value here rules infection in or out');
  });

  it('states that conditional does not mean optional, on very low certainty', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('very low certainty of evidence, including the strong ones');
    expect(text).toContain('conditional does not mean optional');
    expect(text).toContain('within three hours of first suspicion');
    expect(text).toContain('measured against a faster clock');
  });

  it('reports partial looks as partial, and gates handoff on a current full assessment', () => {
    const partial = drive([[0, 'check-labs']], 10).snapshot.choiceFeedback!;
    expect(partial).toContain('supplies no current perfusion assessment');
    const stale: Choices = [[0, 'record-time-zero'], [1, 'record-uncertainty'],
      [2, 'request-time-limited-assessment'], [3, 'review-boundaries'], [4, 'monitor'],
      [5, 'reassess'], [6, 'record-antimicrobial-intent'], [RETURNS + 20, 'handoff']];
    expect(drive(stale, RETURNS + 30).ids).toContain('handoff-refused');
    const fresh = drive(FIXTURES.expert, 54020);
    expect(fresh.ids).toContain('handoff');
    expect(fresh.snapshot.ended).toBe('handoff');
    expect(fresh.snapshot.choiceFeedback).toContain('inside the ceiling');
  });

  it('recovers from every shortcut and still hands off inside the ceiling', () => {
    const run = drive(FIXTURES.recovery, 54020);
    expect(run.snapshot.waitAttempted).toBe(true);
    expect(run.snapshot.tierAttempted).toBe(true);
    expect(run.snapshot.ended).toBe('handoff');
    expect(run.snapshot.antimicrobialInsideCeiling).toBe(true);
  });

  it('bounds an abandoned run with takeover after the ceiling has passed', () => {
    // Both authored consequences must stay reachable: drift passes the ceiling before it shocks.
    expect(RETURNS).toBeLessThan(CEILING);
    expect(CEILING).toBeLessThan(SHOCK);
    expect(SHOCK).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('ceiling-passed');
    expect(run.ids).toContain('shock-gate');
    expect(run.ids).toContain('instructor-takeover');
    // The authored stop makes no outcome claim in either direction.
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and adjacent-lesson shortcuts', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'piperacillin-tazobactam', doseMg: 4500 } });
    engine.apply({ tick: 0, type: 'toxic-shock-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'possible-sepsis-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'possible-sepsis-response', payload: { action: 'start-broad-spectrum' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('possible-sepsis-generic-action-refused');
    expect(ids).toContain('possible-sepsis-action-refused');
    expect(frame.equipment.resuscitation.possibleSepsis!.antimicrobialIntentAtTick).toBeNull();
  });

  it('names no agent, dose, or route anywhere in the snapshot', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 0, type: 'possible-sepsis-response', payload: { action: 'record-antimicrobial-intent' } });
    const snapshot = engine.step().equipment.resuscitation.possibleSepsis!;
    expect(snapshot.antimicrobialIntentAtTick).not.toBeNull();
    expect(snapshot.doseModelAvailable).toBe(false);
    const serialized = JSON.stringify(snapshot).toLowerCase();
    for (const forbidden of ['piperacillin', 'meropenem', 'vancomycin', 'ceftriaxone', 'mg/kg', 'intravenous bolus']) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(snapshot.choiceFeedback).toContain('No agent, dose, route, or combination is selected here');
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(POSSIBLE_SEPSIS_ACTIONS).size).toBe(POSSIBLE_SEPSIS_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
