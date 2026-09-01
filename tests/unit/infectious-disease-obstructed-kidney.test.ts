import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { LearnerAction } from '@platform/kernel/protocol';
import { OBSTRUCTED_INFECTED_KIDNEY_DECOMPRESSION as SCENARIO } from '../../src/modules/infectious-disease/scenarios/obstructed-infected-kidney-decompression';
import { OBSTRUCTED_KIDNEY_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/obstructed-kidney-fixtures';
import { ObstructedKidney, OBSTRUCTED_KIDNEY_DELAY_TICKS as DELAY,
  OBSTRUCTED_KIDNEY_RESPONSE_TICKS as RESPONSE, OBSTRUCTED_KIDNEY_TAKEOVER_TICKS as STOP,
  OBSTRUCTED_KIDNEY_ACTIONS, type ObstructedKidneyAction } from '../../src/modules/infectious-disease/obstructed-kidney';

type Choices = readonly (readonly [number, ObstructedKidneyAction])[];

/** Elapsed behaviour is driven through the lesson model, which reaches a tick in one call. */
function drive(actions: Choices, until: number) {
  const model = new ObstructedKidney();
  const events: { id: string }[] = [];
  for (const [tick, action] of actions) {
    if (tick > 0) events.push(...model.advance(tick));
    events.push(...model.apply(action, tick));
  }
  events.push(...model.advance(until));
  return { model, snapshot: model.snapshot(until), ids: events.map((entry) => entry.id) };
}

describe('Infectious disease obstructed kidney contract', () => {
  it('validates the fixture and declares honest preview evidence', () => {
    expect(SCENARIO.metadata.id).toBe(FIXTURES.scenarioId);
    expect(SCENARIO.metadata.maturity).toBe('preview');
    expect(SCENARIO.formulary).toEqual([]);
    expect(SCENARIO.timeline.every((event) => event.type === 'narrative')).toBe(true);
    const audit = auditClinicalScenario(SCENARIO, '0.1.0-alpha.48', 'infectious-disease', 'emergency-department', 'state_transition');
    const missing = audit.requirements.filter((entry) => entry.status === 'missing').map((entry) => entry.id);
    expect(missing).toContain('inclusive-runtime-verification');
    // The tutor and the worked example landed, so this one is no longer honest as
    // an absence. What is left needs people, hardware, or the objectives decision.
    expect(missing).not.toContain('guidance-and-demonstration');
  });

  it('deteriorates on appropriate antimicrobials while the kidney stays obstructed', () => {
    const untreated = drive([], DELAY + 10);
    expect(untreated.ids).toContain('clinical-deterioration');
    // The score is only available once the learner requests it, never live on the snapshot.
    const observed = drive([[DELAY + 5, 'check-observations']], DELAY + 10);
    expect(observed.snapshot.observationsOnly!.trackAndTriggerScore).toBe(15);
    const vitals = untreated.model.vitals();
    expect(vitals.heartRateBpm).toBe(132);
    expect(vitals.meanArterialMmHg).toBe(58);
    expect(vitals.alertness).toBe('newly confused');
  });

  it('holds the untreated deterioration off once decompression intent is recorded', () => {
    const treated = drive([[0, 'record-decompression-intent']], DELAY + 10);
    expect(treated.ids).not.toContain('clinical-deterioration');
    // Six elapsed hours after recorded intent reach the post-decompression assessment instead.
    expect(treated.ids).toContain('decompression-checkpoint');
    expect(treated.model.vitals().heartRateBpm).toBe(104);
  });

  it('improves after decompression while the inflammatory marker still rises', () => {
    const after = drive([[0, 'record-decompression-intent'], [RESPONSE + 5, 'reassess']], RESPONSE + 20);
    expect(after.ids).toContain('decompression-checkpoint');
    expect(after.ids).toContain('decompressed-reassessment');
    const view = after.snapshot.observation!;
    expect(view.heartRateBpm).toBe(104);
    expect(view.lactateMmolL).toBe(2.1);
    expect(view.trackAndTriggerScore).toBe(5);
    // Improving observations with a still-climbing marker is the point of the case.
    expect(view.crpMgL).toBeGreaterThan(210);
    expect(after.snapshot.durableRecoveryProven).toBe(false);
  });

  it('refuses the four shortcuts without blocking a later handoff', () => {
    const result = drive(FIXTURES.recovery, RESPONSE + 40);
    expect(result.ids).toContain('antibiotics-only-refused');
    expect(result.ids).toContain('marker-delay-refused');
    expect(result.snapshot.antibioticsOnlyAttempted).toBe(true);
    expect(result.snapshot.ended).toBe('handoff');
  });

  it('never marks one drainage modality correct', () => {
    const result = drive([[0, 'choose-modality']], 10);
    expect(result.ids).toContain('modality-choice-refused');
    const intent = drive([[0, 'record-decompression-intent']], 10);
    const feedback = intent.snapshot.choiceFeedback!;
    expect(feedback).toContain('both acceptable');
    expect(feedback).toContain('No modality, access, anaesthetic, timing, or operator is chosen here');
  });

  it('gates handoff on the full bounded record including the deferred stone decision', () => {
    const withoutDeferral: Choices = [[0, 'recognize-obstruction'], [1, 'call-urology'], [2, 'request-cultures'],
      [3, 'record-decompression-intent'], [4, 'review-boundaries'], [5, 'monitor'], [6, 'reassess'], [7, 'handoff']];
    expect(drive(withoutDeferral, 20).ids).toContain('handoff-refused');
    const complete: Choices = [...withoutDeferral.slice(0, 4), [4, 'defer-stone-treatment'],
      [5, 'review-boundaries'], [6, 'monitor'], [7, 'reassess'], [8, 'handoff']];
    const done = drive(complete, 20);
    expect(done.ids).toContain('handoff');
    expect(done.snapshot.ended).toBe('handoff');
  });

  it('bounds an abandoned run with instructor takeover', () => {
    const result = drive([], STOP + 10);
    expect(result.ids).toContain('instructor-takeover');
    expect(result.snapshot.ended).toBe('instructor-takeover');
  });

  it('refuses every generic action, malformed payload, and adjacent-lesson shortcut', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'GB' });
    engine.step();
    engine.apply({ tick: 0, type: 'administer-drug', payload: { drugId: 'gentamicin', doseMg: 400 } });
    engine.apply({ tick: 0, type: 'meningococcal-sepsis-response', payload: { action: 'monitor' } });
    engine.apply({ tick: 0, type: 'obstructed-kidney-response', payload: { action: 'monitor', extra: 1 } });
    engine.apply({ tick: 0, type: 'obstructed-kidney-response', payload: { action: 'place-nephrostomy' } });
    const frame = engine.step();
    const ids = frame.events.map((event) => event.eventId).join(' ');
    expect(ids).toContain('obstructed-kidney-generic-action-refused');
    expect(ids).toContain('obstructed-kidney-action-refused');
    expect(frame.equipment.resuscitation.obstructedKidney!.decompressionIntentAtTick).toBeNull();
  });

  it('surfaces the lesson through the real engine without a dose or capnography model', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    engine.step();
    engine.apply({ tick: 0, type: 'obstructed-kidney-response', payload: { action: 'recognize-obstruction' } } satisfies LearnerAction);
    const frame = engine.step();
    const snapshot = frame.equipment.resuscitation.obstructedKidney!;
    expect(snapshot.recognitionAtTick).not.toBeNull();
    expect(snapshot.doseModelAvailable).toBe(false);
    expect(frame.state.heartRateBpm).toBe(118);
    const serialized = JSON.stringify(snapshot).toLowerCase();
    for (const agent of ['gentamicin', 'ceftriaxone', 'mg/kg', 'ml/kg']) expect(serialized).not.toContain(agent);
  });

  it('reports objectives only for this lesson', () => {
    expect(new Set(OBSTRUCTED_KIDNEY_ACTIONS).size).toBe(OBSTRUCTED_KIDNEY_ACTIONS.length);
    const findings = objectiveFindings(SCENARIO, [], 0, 0, [], []);
    expect(findings).toHaveLength(SCENARIO.metadata.objectives.length);
    expect(findings.every((entry) => entry.outcome === 'not-met')).toBe(true);
  });
});
