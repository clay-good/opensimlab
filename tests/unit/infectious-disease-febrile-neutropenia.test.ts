import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { FEBRILE_NEUTROPENIA_BLIND_EXAMINATION as SCENARIO } from '../../src/modules/infectious-disease/scenarios/febrile-neutropenia-blind-examination';
import { FEBRILE_NEUTROPENIA_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/febrile-neutropenia-fixtures';
import { FebrileNeutropenia, FEBRILE_NEUTROPENIA_DELAY_TICKS as DELAY,
  FEBRILE_NEUTROPENIA_RESPONSE_TICKS as RESPONSE, FEBRILE_NEUTROPENIA_TAKEOVER_TICKS as STOP,
  FEBRILE_NEUTROPENIA_ACTIONS, type FebrileNeutropeniaAction } from '../../src/modules/infectious-disease/febrile-neutropenia';

type Choices = readonly (readonly [number, FebrileNeutropeniaAction])[];

function drive(actions: Choices, until: number) {
  const model = new FebrileNeutropenia();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Infectious disease febrile neutropenia contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'infectious-disease', 'emergency-department', 'state_transition');
    const missing = audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id);
    expect(missing).toContain('inclusive-runtime-verification');
  });

  it('deteriorates by falling temperature, not rising fever, and without a leucocytosis', () => {
    const untreated = drive([], DELAY + 10);
    expect(untreated.ids).toContain('clinical-deterioration');
    const vitals = untreated.model.vitals();
    // The naive heuristic says a falling temperature is improvement. Here it is not.
    expect(vitals.coreTemperatureC).toBeLessThan(37);
    expect(vitals.meanArterialMmHg).toBe(61);
    const labs = drive([[0, 'check-labs']], DELAY + 10);
    expect(labs.snapshot.labObservation!.whiteCellsX109L).toBeLessThanOrEqual(0.8);
  });

  it('improves observations after intent while the marker keeps climbing', () => {
    const after = drive([[0, 'record-antimicrobial-intent'], [RESPONSE + 5, 'reassess']], RESPONSE + 20);
    expect(after.ids).toContain('response-checkpoint');
    expect(after.ids).toContain('treated-reassessment');
    const view = after.snapshot.observation!;
    expect(view.coreTemperatureC).toBeLessThan(38.4);
    expect(view.heartRateBpm).toBe(96);
    // Rising marker alongside improvement is the deliberate trap.
    expect(view.crpMgL).toBeGreaterThan(42);
    // Neutropenia persists regardless: treatment does not restore the count.
    expect(view.absoluteNeutrophilsX109L).toBeLessThanOrEqual(0.2);
    expect(after.snapshot.durableRecoveryProven).toBe(false);
  });

  it('refuses all four reassurance shortcuts without blocking a later handoff', () => {
    const result = drive(FIXTURES.recovery, RESPONSE + 40);
    expect(result.ids).toContain('crp-reassurance-refused');
    expect(result.ids).toContain('source-wait-refused');
    expect(result.snapshot.crpReassuranceAttempted).toBe(true);
    expect(result.snapshot.ended).toBe('handoff');
    const scored = drive([[0, 'score-defers-antimicrobials'], [1, 'expect-leukocytosis']], 20);
    expect(scored.ids).toContain('score-deferral-refused');
    expect(scored.ids).toContain('leukocytosis-refused');
  });

  it('never lets a score or a marker stand in for the decision', () => {
    const boundaries = drive([[0, 'review-boundaries']], 10);
    const text = boundaries.snapshot.choiceFeedback!;
    expect(text).toContain('system-design safety margin');
    expect(text).toContain('not validated to decide whether to give antimicrobials at all');
    expect(text).toContain('uninformative at the door');
  });

  it('gates handoff on the full bounded record', () => {
    const partial: Choices = [[0, 'recognize-neutropenic-fever'], [1, 'activate-pathway'],
      [2, 'request-cultures'], [3, 'record-antimicrobial-intent'], [4, 'monitor'], [5, 'reassess'], [6, 'handoff']];
    expect(drive(partial, 20).ids).toContain('handoff-refused');
    const complete: Choices = [...partial.slice(0, 4), [4, 'review-boundaries'], [5, 'monitor'],
      [6, 'reassess'], [7, 'handoff']];
    const done = drive(complete, 20);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with instructor takeover after the untreated contrast', () => {
    expect(STOP).toBeGreaterThan(DELAY);
    const result = drive([], STOP + 10);
    expect(result.ids).toContain('clinical-deterioration');
    expect(result.ids).toContain('instructor-takeover');
    expect(result.snapshot.ended).toBe('instructor-takeover');
  });

  it('refuses generic actions, malformed payloads, and adjacent-lesson shortcuts', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'piperacillin', doseMg: 4500 } });
    engine.apply({ tick: 0, type: 'obstructed-kidney-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'febrile-neutropenia-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'febrile-neutropenia-response', payload: { action: 'give-piptazo' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('febrile-neutropenia-generic-action-refused');
    expect(ids).toContain('febrile-neutropenia-action-refused');
    expect(frame.equipment.resuscitation.febrileNeutropenia!.antimicrobialIntentAtTick).toBeNull();
  });

  it('surfaces through the real engine with no agent named and no dose model', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 0, type: 'febrile-neutropenia-response', payload: { action: 'record-antimicrobial-intent' } });
    const frame = engine.step();
    const snapshot = frame.equipment.resuscitation.febrileNeutropenia!;
    expect(snapshot.antimicrobialIntentAtTick).not.toBeNull();
    expect(snapshot.doseModelAvailable).toBe(false);
    const serialized = JSON.stringify(snapshot).toLowerCase();
    for (const agent of ['piperacillin', 'cefepime', 'meropenem', 'tazobactam', 'mg/kg']) {
      expect(serialized).not.toContain(agent);
    }
    expect(snapshot.choiceFeedback).toContain('according to the local protocol');
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(FEBRILE_NEUTROPENIA_ACTIONS).size).toBe(FEBRILE_NEUTROPENIA_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
