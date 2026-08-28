import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { TOXIC_SHOCK_A_DEFINITION_THAT_CANNOT_CLOSE as SCENARIO } from '../../src/modules/infectious-disease/scenarios/toxic-shock-a-definition-that-cannot-close';
import { TOXIC_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/toxic-shock-fixtures';
import { ToxicShock, TOXIC_SHOCK_DETERIORATION_TICKS as DETERIORATION,
  TOXIC_SHOCK_TAKEOVER_TICKS as STOP, TOXIC_SHOCK_ACTIONS,
  type ToxicShockAction } from '../../src/modules/infectious-disease/toxic-shock';

type Choices = readonly (readonly [number, ToxicShockAction])[];

function drive(actions: Choices, until: number) {
  const model = new ToxicShock();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Infectious disease toxic shock contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'infectious-disease', 'emergency-department', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  it('never closes either definition, in any state', () => {
    for (const until of [10, DETERIORATION + 20, STOP - 10]) {
      const run = drive([], until);
      expect(run.snapshot.staphylococcalDefinitionMet).toBe(false);
      expect(run.snapshot.streptococcalDefinitionMet).toBe(false);
    }
  });

  it('keeps desquamation absent and cultures pending throughout', () => {
    const before = drive([[0, 'check-perfusion'], [1, 'check-labs']], 10);
    const after = drive([[DETERIORATION + 5, 'check-perfusion'], [DETERIORATION + 6, 'check-labs']], DETERIORATION + 20);
    // Desquamation belongs to a week or two from now: it cannot appear in this rehearsal.
    expect(before.snapshot.perfusionObservation!.desquamation).toBe(false);
    expect(after.snapshot.perfusionObservation!.desquamation).toBe(false);
    // No growth at four hours is uninformative, never reported as negative.
    expect(before.snapshot.labObservation!.culturesPending).toBe(true);
    expect(after.snapshot.labObservation!.culturesPending).toBe(true);
  });

  it('crosses further criteria on both definitions without closing either', () => {
    const before = drive([[0, 'reassess']], 10).snapshot.observation!;
    const after = drive([[DETERIORATION + 5, 'reassess']], DETERIORATION + 20).snapshot.observation!;
    // Creatinine crosses the streptococcal cut; platelets cross the shared one.
    expect(before.creatinineMgDl).toBeLessThan(2);
    expect(after.creatinineMgDl).toBeGreaterThanOrEqual(2);
    expect(before.plateletsX109L).toBeGreaterThan(100);
    expect(after.plateletsX109L).toBeLessThan(100);
    expect(after.ckUL).toBeGreaterThan(before.ckUL);
  });

  it('refuses closure, exclusion, and both culture misreadings', () => {
    const result = drive(FIXTURES.recovery, DETERIORATION + 40);
    expect(result.ids).toContain('confirmation-refused');
    expect(result.ids).toContain('criteria-exclusion-refused');
    expect(result.snapshot.confirmationAttempted).toBe(true);
    expect(result.snapshot.ended).toBe('handoff');
    const cultures = drive([[0, 'pending-cultures-exclude'], [1, 'negative-cultures-mean-no-infection']], 20);
    expect(cultures.ids).toContain('pending-culture-refused');
    expect(cultures.ids).toContain('negative-culture-misread-refused');
  });

  it('names the two different reasons the definitions stay open', () => {
    const text = drive([[0, 'record-definition-status']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('temporal reason');
    expect(text).toContain('microbiological reason');
    expect(text).toContain('may remain unmet permanently');
  });

  it('states that one culture answers one definition and violates the other', () => {
    const text = drive([[0, 'request-cultures']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('two mutually exclusive unknowns');
  });

  it('gates handoff on the recorded definition status', () => {
    const withoutStatus: Choices = [[0, 'recognize-toxin-pattern'], [1, 'activate-critical-care'],
      [2, 'request-cultures'], [3, 'record-treatment-intent'], [4, 'review-boundaries'],
      [5, 'monitor'], [6, 'reassess'], [7, 'handoff']];
    expect(drive(withoutStatus, 20).ids).toContain('handoff-refused');
    const complete: Choices = [...withoutStatus.slice(0, 4), [4, 'record-definition-status'],
      [5, 'review-boundaries'], [6, 'monitor'], [7, 'reassess'], [8, 'handoff']];
    const done = drive(complete, 20);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover after the deterioration', () => {
    expect(STOP).toBeGreaterThan(DETERIORATION);
    const result = drive([], STOP + 10);
    expect(result.ids).toContain('clinical-deterioration');
    expect(result.ids).toContain('instructor-takeover');
  });

  it('refuses generic actions, malformed payloads, and adjacent-lesson shortcuts', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'clindamycin', doseMg: 1200 } });
    engine.apply({ tick: 0, type: 'severe-pneumonia-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'toxic-shock-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'toxic-shock-response', payload: { action: 'give-ivig' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('toxic-shock-generic-action-refused');
    expect(ids).toContain('toxic-shock-action-refused');
    expect(frame.equipment.resuscitation.toxicShock!.treatmentIntentAtTick).toBeNull();
  });

  it('names no agent and no adjunct', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 0, type: 'toxic-shock-response', payload: { action: 'record-treatment-intent' } });
    const snapshot = engine.step().equipment.resuscitation.toxicShock!;
    expect(snapshot.treatmentIntentAtTick).not.toBeNull();
    expect(snapshot.doseModelAvailable).toBe(false);
    const serialized = JSON.stringify(snapshot).toLowerCase();
    for (const forbidden of ['clindamycin', 'vancomycin', 'noradrenaline', 'mg/kg']) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(snapshot.choiceFeedback).toContain('anti-toxin and immunoglobulin questions are qualified-team decisions');
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(TOXIC_SHOCK_ACTIONS).size).toBe(TOXIC_SHOCK_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
