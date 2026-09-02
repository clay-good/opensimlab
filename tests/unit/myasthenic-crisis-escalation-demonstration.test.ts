/**
 * The worked example and observed-state tutor for respiratory failure that
 * keeps its saturation.
 *
 * A room-air saturation of 97% and an ordinary blood gas are what this looks
 * like shortly before it stops looking like anything. Both the tutor and the
 * example read the direction of the vital capacity rather than its value, and
 * both refuse to treat any single number as a threshold.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MYASTHENIC_CRISIS_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/myasthenic-crisis-escalation';
import { MYASTHENIA_FIXTURES as FIXTURES } from '../../src/modules/neurology/myasthenic-crisis-escalation-fixtures';
import {
  MYASTHENIA_DEMONSTRATION_VERSION, myastheniaDemonstrationStep,
  supportsMyastheniaDemonstration,
} from '../../src/modules/neurology/demo/myasthenic-crisis-escalation-demonstration';
import { myastheniaInlinePrompt } from '../../src/modules/neurology/tutor/myasthenic-crisis-escalation-guidance';
import type { MyastheniaAction } from '../../src/modules/neurology/myasthenic-crisis-escalation';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyMyasthenicCrisisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MyastheniaAction) => {
  engine.apply({ tick, type: 'myasthenic-crisis-escalation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = myastheniaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'myasthenic-crisis-escalation-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Wait For The Saturation', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MYASTHENIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMyastheniaDemonstration(SCENARIO)).toBe(true);
    expect(supportsMyastheniaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMyastheniaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'ownership', 'causes', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.causesAtTick!);
    expect(patient.causesAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads the direction of travel rather than the values', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('not the numbers as they stand');
    expect(opening).toContain('both sets are moving the same way');
  });

  it('calls the crisis while the saturation is still normal, and refuses cutoffs', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('shortly before it stops looking like anything');
    expect(recognition).toContain('hypercapnia here is a late sign');
    expect(recognition).toContain('no one vital capacity, pressure, count or gas value is a universal threshold');
    expect(patient.impendingCrisisRecognized).toBe(true);
  });

  it('escalates ahead of the event and keeps the secretions a separate emergency', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('ahead of the event rather than in response to it');
    expect(ownership).toContain('one is about ventilating and the other is about protecting');
    expect(patient.qualifiedNeurocriticalOwnershipActive).toBe(true);
    expect(patient.qualifiedAirwayOwnershipActive).toBe(true);
  });

  it('treats the chest as the trigger and leaves infection or aspiration open', () => {
    const causes = narrations[beats.indexOf('causes')]!;
    expect(causes).toContain('the trigger, and keep every alternative open');
    expect(causes).toContain('whether that shadow is infection or aspiration');
    expect(causes).toContain('alongside the escalation rather than in front of it');
  });

  it('notes what the saturation did the whole way down', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('saturation of 95% the whole way down');
    expect(handoff).toContain('invasive ventilation is required');
    expect(narration).toContain('before the emergency did');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.triggerProven).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.weaningSuccessProven).toBe(false);
    expect(patient.durableNeurologicRecoveryProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['her saturation is reassuring', 'the pneumonia is the whole problem', 'she does not need the airway team', 'the gas is normal so she is safe']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('measures nothing and selects no drug, oxygen, ventilation, or airway anywhere', () => {
    expect(patient.respiratoryMechanicsAcquiredByLearner).toBe(false);
    expect(patient.bloodGasAcquiredByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.ventilationSelectedByLearner).toBe(false);
    expect(patient.airwayDeviceSelectedByLearner).toBe(false);
    expect(patient.airwayProcedurePerformedByLearner).toBe(false);
    expect(patient.medicationDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['intubate her now', 'start bipap', 'give plasma exchange', 'measure her vital capacity yourself']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads The Trend', () => {
  it('opens on the direction of travel', () => {
    const engine = create(); engine.step();
    const prompt = myastheniaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', myasthenia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('myasthenia-trajectory');
    expect(prompt.because).toContain('both sets are moving the same way');
  });

  it('calls the crisis while the saturation is still normal', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = myastheniaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', myasthenia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('myasthenia-recognition');
    expect(prompt.suggestion).toContain('while the saturation is still normal');
    expect(prompt.because).toContain('hypercapnia here is a late sign');
    expect(prompt.because).toContain('no one vital capacity, pressure, count or gas value is a universal threshold');
  });

  it('escalates ahead of the event', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = myastheniaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', myasthenia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('myasthenia-ownership');
    expect(prompt.because).toContain('ahead of the event rather than in response to it');
    expect(prompt.because).toContain('one is about ventilating and the other is about protecting');
  });

  it('keeps the chest a trigger with infection or aspiration open', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = myastheniaInlinePrompt('guided', {
      scenarioVersion: '0.1.0', myasthenia: snapshot(engine),
    })!;
    expect(prompt.id).toBe('myasthenia-causes');
    expect(prompt.because).toContain('whether that shadow is infection or aspiration');
    expect(prompt.because).toContain('alongside the escalation rather than in front of it');
  });

  it('never calls the saturation reassuring, proves a trigger, or picks a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = myastheniaInlinePrompt('guided', {
        scenarioVersion: '0.1.0', myasthenia: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['her saturation is reassuring', 'the pneumonia is the whole problem', 'intubate her now', 'the gas is normal so she is safe']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(myastheniaInlinePrompt('guided', { scenarioVersion: '0.1.0', myasthenia: patient })!.id)
      .toBe('myasthenia-later');
    expect(myastheniaInlinePrompt('coached', { scenarioVersion: '0.1.0', myasthenia: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(myastheniaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', myasthenia: patient })).toBeNull();
    expect(myastheniaInlinePrompt('guided', { scenarioVersion: '0.1.1', myasthenia: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(myastheniaInlinePrompt('guided', { scenarioVersion: '0.1.0', myasthenia: snapshot(engine) })).toBeNull();
  });
});
