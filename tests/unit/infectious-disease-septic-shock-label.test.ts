import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import { SEPTIC_SHOCK_A_LABEL_THE_TREATMENT_CREATES as SCENARIO } from '../../src/modules/infectious-disease/scenarios/septic-shock-a-label-the-treatment-creates';
import { SEPTIC_SHOCK_LABEL_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/septic-shock-label-fixtures';
import { SepticShockLabel, SEPTIC_SHOCK_LABEL_CEILING_TICKS as CEILING,
  SEPTIC_SHOCK_LABEL_TRIAL_TICKS as TRIAL, SEPTIC_SHOCK_LABEL_TAKEOVER_TICKS as STOP,
  SEPTIC_SHOCK_LABEL_ACTIONS, type SepticShockLabelAction } from '../../src/modules/infectious-disease/septic-shock-label';

type Choices = readonly (readonly [number, SepticShockLabelAction])[];

function drive(actions: Choices, until: number) {
  const model = new SepticShockLabel();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Infectious disease septic shock label contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'infectious-disease', 'emergency-department', 'state_transition');
    expect(audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id))
      .toContain('inclusive-runtime-verification');
  });

  // The lesson exists because two criteria describe a treatment that has not happened yet.
  it('reports two of the three criteria as undecidable before the trial', () => {
    const before = drive([[0, 'record-hypoperfusion']], 100).snapshot;
    expect(before.trialComplete).toBe(false);
    expect(before.definitionReadable).toBe(false);
    expect(before.vasopressorDependent).toBe(false);
    expect(before.meanPressureAtTarget).toBe(false);
    // The one criterion that is answerable already is answered, and answered true.
    expect(before.lactateAboveThreshold).toBe(true);
  });

  it('makes the definition readable only once the trial completes', () => {
    const run = drive([[0, 'record-resuscitation-intent']], TRIAL + 20);
    expect(run.ids).toContain('trial-complete');
    const after = run.snapshot;
    expect(after.definitionReadable).toBe(true);
    expect(after.vasopressorDependent).toBe(true);
    expect(after.meanPressureAtTarget).toBe(true);
    expect(after.lactateAboveThreshold).toBe(true);
  });

  it('never completes a trial that was never intended', () => {
    // The label is made by the treatment, so a trial cannot complete on elapsed time alone.
    const idle = drive([[0, 'record-hypoperfusion']], TRIAL + 6000);
    expect(idle.ids).not.toContain('trial-complete');
    expect(idle.snapshot.trialComplete).toBe(false);
    expect(idle.snapshot.definitionReadable).toBe(false);
    // And it runs from the recorded intent rather than from the start of the case.
    const late = drive([[TRIAL, 'record-resuscitation-intent']], TRIAL + 20);
    expect(late.snapshot.trialComplete).toBe(false);
    expect(drive([[TRIAL, 'record-resuscitation-intent']], TRIAL * 2 + 20).snapshot.trialComplete).toBe(true);
  });

  it('refuses the label before the trial can answer it', () => {
    const run = drive([[0, 'declare-shock-now']], 20);
    expect(run.ids).toContain('early-label-refused');
    expect(run.snapshot.earlyLabelAttempted).toBe(true);
    expect(run.snapshot.definitionReadable).toBe(false);
    const text = run.snapshot.choiceFeedback!;
    expect(text).toContain('two of the three parts have no truth value yet');
    // The quality-measure threshold is a different construct and must not be conflated.
    expect(text).toContain('a lactate above 4 belongs to a national quality measure');
  });

  it('refuses the three claims the evidence does not support', () => {
    const hypoxia = drive([[0, 'lactate-means-hypoxia']], 10);
    expect(hypoxia.ids).toContain('hypoxia-refused');
    expect(hypoxia.snapshot.choiceFeedback).toContain('not an oxygen-debt meter');
    const normalize = drive([[0, 'resuscitate-to-normal-lactate']], 10);
    expect(normalize.ids).toContain('normalization-refused');
    expect(normalize.snapshot.choiceFeedback).toContain('rather than continuing fluids until normalization');
    const target = drive([[0, 'raise-the-map-target']], 10);
    expect(target.ids).toContain('map-target-refused');
    expect(target.snapshot.choiceFeedback).toContain('65 over higher targets');
    expect(target.snapshot.choiceFeedback).toContain('60 to 65 mmHg is now suggested');
  });

  it('states the targets with their grades rather than stripping them off', () => {
    const text = drive([[0, 'review-boundaries']], 10).snapshot.choiceFeedback!;
    expect(text).toContain('strong recommendation on moderate certainty');
    expect(text).toContain('conditional on very low certainty, the weakest statement here');
    expect(text).toContain('floor with a tolerance band, not a proven optimum');
    expect(text).toContain('harms of both under- and over-resuscitation');
  });

  it('reports a passed one-hour ceiling rather than hiding it', () => {
    const late = drive([[CEILING + 50, 'record-resuscitation-intent']], CEILING + 60);
    expect(late.ids).toContain('ceiling-passed');
    expect(late.snapshot.ceilingPassed).toBe(true);
    expect(late.snapshot.resuscitationIntentInsideCeiling).toBe(false);
    expect(late.snapshot.choiceFeedback).toContain('after the one-hour ceiling has passed');
    const inside = drive([[10, 'record-resuscitation-intent']], 20);
    expect(inside.snapshot.resuscitationIntentInsideCeiling).toBe(true);
    expect(inside.ids).not.toContain('ceiling-passed');
  });

  it('gates handoff on a current full assessment and recovers from shortcuts', () => {
    const stale: Choices = [[0, 'record-hypoperfusion'], [1, 'activate-critical-care'],
      [2, 'record-classification-open'], [3, 'record-resuscitation-intent'],
      [4, 'review-boundaries'], [5, 'monitor'], [6, 'reassess'], [TRIAL + 20, 'handoff']];
    expect(drive(stale, TRIAL + 30).ids).toContain('handoff-refused');
    const done = drive(FIXTURES.expert, 56020);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
    expect(done.snapshot.trialObserved).toBe(true);
    expect(done.snapshot.choiceFeedback).toContain('the label reflects a treatment as much as a patient');
    const recovered = drive(FIXTURES.recovery, 56030);
    expect(recovered.snapshot.earlyLabelAttempted).toBe(true);
    expect(recovered.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with takeover', () => {
    expect(CEILING).toBeLessThan(TRIAL);
    expect(TRIAL).toBeLessThan(STOP);
    const run = drive([], STOP + 10);
    expect(run.ids).toContain('ceiling-passed');
    expect(run.ids).toContain('instructor-takeover');
    expect(run.snapshot.choiceFeedback).toBeNull();
  });

  it('refuses generic actions, malformed payloads, and the adjacent shock lesson', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'noradrenaline', doseMg: 1 } });
    // A different lesson already owns 'septic-shock-response'; this one must not answer to it.
    engine.apply({ tick: 0, type: 'septic-shock-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'septic-shock-label-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'septic-shock-label-response', payload: { action: 'give-fluids' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('septic-shock-label-generic-action-refused');
    expect(ids).toContain('septic-shock-label-action-refused');
    expect(frame.equipment.resuscitation.septicShockLabel!.monitoringAtTick).toBeNull();
  });

  it('names no fluid, agent, or dose after ANY action, not just the obvious one', () => {
    // The first version of this guard exercised one action and missed a fluid volume that the
    // boundary review put straight into the snapshot. Every action now has to clear it.
    const forbidden = ['noradrenaline', 'norepinephrine', 'vasopressin', 'hartmann', 'saline',
      'ml/kg', 'mcg/kg/min', 'milligram', 'bolus of'];
    for (const action of SEPTIC_SHOCK_LABEL_ACTIONS) {
      const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
      engine.step();
      engine.apply({ tick: 0, type: 'septic-shock-label-response', payload: { action } });
      const snapshot = engine.step().equipment.resuscitation.septicShockLabel!;
      const serialized = JSON.stringify(snapshot).toLowerCase();
      for (const term of forbidden) expect(serialized, `${action} leaked ${term}`).not.toContain(term);
    }
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 0, type: 'septic-shock-label-response', payload: { action: 'record-resuscitation-intent' } });
    const snapshot = engine.step().equipment.resuscitation.septicShockLabel!;
    expect(snapshot.resuscitationIntentAtTick).not.toBeNull();
    expect(snapshot.doseModelAvailable).toBe(false);
    expect(snapshot.choiceFeedback).toContain('No fluid volume, rate, vasoactive agent, dose, or endpoint is selected here');
  });

  it('treats a repeated recording action as a no-op rather than a fresh claim', () => {
    // Re-applying must not emit a second acceptance, or the record would re-assert the
    // pre-treatment state as current long after the trial has changed it.
    const once = drive([[0, 'record-hypoperfusion']], 10);
    expect(once.ids.filter((id) => id === 'hypoperfusion-recorded')).toHaveLength(1);
    const twice = drive([[0, 'record-hypoperfusion'], [TRIAL + 20, 'record-hypoperfusion']], TRIAL + 30);
    expect(twice.ids.filter((id) => id === 'hypoperfusion-recorded')).toHaveLength(1);
    expect(twice.snapshot.hypoperfusionAtTick).toBe(0);
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(SEPTIC_SHOCK_LABEL_ACTIONS).size).toBe(SEPTIC_SHOCK_LABEL_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
