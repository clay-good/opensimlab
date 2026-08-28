import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { SEVERE_PNEUMONIA_THE_SCORE_ANSWERED_ANOTHER_QUESTION as SCENARIO } from '../../src/modules/infectious-disease/scenarios/severe-pneumonia-the-score-answered-another-question';
import { SEVERE_PNEUMONIA_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/severe-pneumonia-fixtures';
import { SeverePneumonia, SEVERE_PNEUMONIA_DETERIORATION_TICKS as DETERIORATION,
  SEVERE_PNEUMONIA_TAKEOVER_TICKS as STOP, SEVERE_PNEUMONIA_ACTIONS,
  type SeverePneumoniaAction } from '../../src/modules/infectious-disease/severe-pneumonia';

type Choices = readonly (readonly [number, SeverePneumoniaAction])[];

function drive(actions: Choices, until: number) {
  const model = new SeverePneumonia();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Infectious disease severe pneumonia contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'infectious-disease', 'emergency-department', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  it('presents two correct instruments that disagree', () => {
    const start = drive([[0, 'reassess']], 10).snapshot.observation!;
    // The mortality band says ward; the severity criteria say severe. Both are right.
    expect(start.mortalityScore).toBe(2);
    expect(start.severityCriteria).toBe(3);
    expect(start.pfRatio).toBe(171);
    expect(start.pfRatio).toBeLessThanOrEqual(250);
    expect(start.respiratoryRateBpm).toBeGreaterThanOrEqual(30);
  });

  it('worsens oxygenation far more than the saturation suggests', () => {
    const before = drive([[0, 'check-respiratory']], 10).snapshot.respiratoryObservation!;
    const after = drive([[DETERIORATION + 5, 'check-respiratory']], DETERIORATION + 20).snapshot.respiratoryObservation!;
    // Saturation falls two points while the inspired fraction nearly doubles.
    expect(before.spo2Percent - after.spo2Percent).toBe(2);
    expect(after.fio2).toBeGreaterThan(before.fio2);
    // The ratio tells the truth the saturation hides.
    expect(after.pfRatio).toBeLessThan(before.pfRatio / 1.5);
  });

  it('lets the mortality score catch up only after the deterioration', () => {
    const after = drive([[DETERIORATION + 5, 'reassess']], DETERIORATION + 20);
    expect(after.ids).toContain('clinical-deterioration');
    const view = after.snapshot.observation!;
    expect(view.mortalityScore).toBe(4);
    expect(view.severityCriteria).toBe(5);
    expect(view.confused).toBe(true);
    expect(after.snapshot.durableRecoveryProven).toBe(false);
  });

  it('deteriorates whatever the learner records', () => {
    const idle = drive([], DETERIORATION + 10);
    const active = drive([[0, 'reconcile-supplied-scores'], [1, 'recognize-instrument-mismatch'],
      [2, 'call-critical-care']], DETERIORATION + 10);
    expect(idle.model.vitals()).toEqual(active.model.vitals());
    expect(idle.snapshot.criticalCareBeforeDeterioration).toBe(false);
    expect(active.snapshot.criticalCareBeforeDeterioration).toBe(true);
  });

  it('refuses all four interpretive shortcuts', () => {
    const result = drive(FIXTURES.recovery, DETERIORATION + 40);
    expect(result.ids).toContain('mortality-score-refused');
    expect(result.ids).toContain('wait-refused');
    expect(result.snapshot.mortalityScoreAttempted).toBe(true);
    expect(result.snapshot.ended).toBe('handoff');
    const others = drive([[0, 'marker-grades-severity'], [1, 'saturation-alone-is-adequate']], 20);
    expect(others.ids).toContain('marker-severity-refused');
    expect(others.ids).toContain('saturation-refused');
  });

  it('states the triage evidence limits explicitly', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('has ever been shown in a randomised trial to improve outcomes');
    expect(text).toContain('confounded by indication');
    expect(text).toContain('appear in no criteria set at all');
  });

  it('gates handoff on the full bounded record', () => {
    const partial: Choices = [[0, 'reconcile-supplied-scores'], [1, 'recognize-instrument-mismatch'],
      [2, 'call-critical-care'], [3, 'review-boundaries'], [4, 'monitor'], [5, 'reassess'], [6, 'handoff']];
    expect(drive(partial, 20).ids).toContain('handoff-refused');
    const complete: Choices = [...partial.slice(0, 3), [3, 'record-escalation-intent'],
      [4, 'review-boundaries'], [5, 'monitor'], [6, 'reassess'], [7, 'handoff']];
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
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'co-amoxiclav', doseMg: 1200 } });
    engine.apply({ tick: 0, type: 'endocarditis-heart-failure-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'severe-pneumonia-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'severe-pneumonia-response', payload: { action: 'intubate-now' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('severe-pneumonia-generic-action-refused');
    expect(ids).toContain('severe-pneumonia-action-refused');
    expect(frame.equipment.resuscitation.severePneumonia!.criticalCareAtTick).toBeNull();
  });

  it('names no drug and exposes no ventilatory control', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 0, type: 'severe-pneumonia-response', payload: { action: 'record-escalation-intent' } });
    const snapshot = engine.step().equipment.resuscitation.severePneumonia!;
    expect(snapshot.escalationIntentAtTick).not.toBeNull();
    expect(snapshot.doseModelAvailable).toBe(false);
    const serialized = JSON.stringify(snapshot).toLowerCase();
    for (const forbidden of ['co-amoxiclav', 'amoxicillin', 'clarithromycin', 'dexamethasone', 'mg/kg']) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(snapshot.choiceFeedback).toContain('Nothing here selects an oxygen device, a ventilation mode');
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(SEVERE_PNEUMONIA_ACTIONS).size).toBe(SEVERE_PNEUMONIA_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
