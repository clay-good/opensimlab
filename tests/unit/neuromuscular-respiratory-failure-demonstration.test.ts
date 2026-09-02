/**
 * The worked example and observed-state tutor for a patient whose saturation
 * looks fine.
 *
 * A room-air 94% is the number most likely to reassure and the one that says
 * least about whether he is ventilating. Nothing here performs or interprets
 * a test, and nothing here selects a device.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NEUROMUSCULAR_RESPIRATORY_FAILURE_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/neuromuscular-respiratory-failure-reassessment';
import { NEUROMUSCULAR_RESPIRATORY_FAILURE_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/neuromuscular-respiratory-failure-reassessment-fixtures';
import {
  NEUROMUSCULAR_RESPIRATORY_FAILURE_DEMONSTRATION_VERSION, neuromuscularRespiratoryFailureDemonstrationStep,
  supportsNeuromuscularRespiratoryFailureDemonstration,
} from '../../src/modules/respiratory-medicine/demo/neuromuscular-respiratory-failure-reassessment-demonstration';
import { neuromuscularRespiratoryFailureInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/neuromuscular-respiratory-failure-reassessment-guidance';
import type { NeuromuscularRespiratoryFailureAction } from '../../src/modules/respiratory-medicine/neuromuscular-respiratory-failure-reassessment';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neuromuscularRespiratoryFailureAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: NeuromuscularRespiratoryFailureAction) => {
  engine.apply({ tick, type: 'neuromuscular-respiratory-failure-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = neuromuscularRespiratoryFailureDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'neuromuscular-respiratory-failure-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Trust The Saturation', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NEUROMUSCULAR_RESPIRATORY_FAILURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNeuromuscularRespiratoryFailureDemonstration(SCENARIO)).toBe(true);
    expect(supportsNeuromuscularRespiratoryFailureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsNeuromuscularRespiratoryFailureDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'failure', 'escalation', 'review', 'ownership', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.failureAtTick!);
    expect(patient.failureAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(patient.failureAtTick).toBeLessThan(patient.reviewAtTick!);
    // Ownership waits for both lanes; the handoff waits for a later tick still.
    expect(patient.escalationAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.reviewAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('names the reassuring number as the one that says least', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('the number most likely to reassure you');
    expect(trajectory).toContain('says least about whether he is ventilating');
    expect(patient.establishedMotorNeuronDiseaseAuthored).toBe(true);
  });

  it('lets the convergent pattern establish failure rather than one cutoff', () => {
    const failure = narrations[beats.indexOf('failure')]!;
    expect(failure).toContain('Let the whole pattern establish it, not one cutoff');
    expect(failure).toContain('No single one of these is offered as a universal threshold');
    expect(patient.respiratoryMeasurementsAuthored).toBe(true);
    expect(patient.daytimeHypercapniaAuthored).toBe(true);
  });

  it('connects experienced help before the cause review is finished', () => {
    const escalation = narrations[beats.indexOf('escalation')]!;
    expect(escalation).toContain('before the cause review is finished');
    expect(escalation).toContain('not the same as choosing a treatment');
    expect(escalation).toContain('runs in parallel with this, not after it');
  });

  it('keeps every alternative open and the disease central', () => {
    const review = narrations[beats.indexOf('review')]!;
    expect(review).toContain('narrow the field and permanently exclude nothing');
    expect(review).toContain('belong in the respiratory plan rather than alongside it');
  });

  it('documents his preferences rather than inferring them', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('ask him rather than assume');
    expect(ownership).toContain('clinical work rather than a courtesy');
    expect(patient.patientPreferenceInferred).toBe(false);
  });

  it('ends on work that is still active and still unfinished', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('live right now');
    expect(handoff).toContain('a name against each part of it');
    expect(narration).toContain('somebody’s name on it');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('delivers nothing, selects nothing, and predicts nothing', () => {
    expect(patient.examinationPerformedByLearner).toBe(false);
    expect(patient.respiratoryStrengthMeasuredByLearner).toBe(false);
    expect(patient.bloodGasAcquiredByLearner).toBe(false);
    expect(patient.testInterpretedByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.airwayAssessedByLearner).toBe(false);
    expect(patient.coughAssessedByLearner).toBe(false);
    expect(patient.ventilationDeliveredByLearner).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.supportDeviceSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.diagnosisDetermined).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['his saturation is reassuring', 'he does not need ventilation', 'start niv', 'start bipap', 'set the backup rate', 'intubate him', 'he has months']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Does Not Trust The Saturation', () => {
  it('opens on three months against two weeks', () => {
    const engine = create(); engine.step();
    const prompt = neuromuscularRespiratoryFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('nmrf-trajectory');
    expect(prompt.suggestion).toContain('three months of decline against two weeks of new symptoms');
    expect(prompt.because).toContain('says least about whether he is ventilating');
  });

  it('establishes the pattern from the whole picture next', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = neuromuscularRespiratoryFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('nmrf-failure');
    expect(prompt.suggestion).toContain('not one cutoff');
    expect(prompt.because).toContain('convergent serial decline');
  });

  it('will not let the cause review delay experienced help', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = neuromuscularRespiratoryFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('nmrf-escalation');
    expect(prompt.suggestion).toContain('before the cause review is finished');
    expect(prompt.because).toContain('runs in parallel with this, not after it');
  });

  it('asks him rather than assuming what he would want', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const prompt = neuromuscularRespiratoryFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('nmrf-ownership');
    expect(prompt.suggestion).toContain('ask him rather than assume');
    expect(prompt.because).toContain('rather than a courtesy');
  });

  it('never diagnoses, selects a device, or predicts an outcome', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = neuromuscularRespiratoryFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['start niv', 'start bipap', 'intubate him', 'he has months', 'his saturation is reassuring']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(neuromuscularRespiratoryFailureInlinePrompt('unassisted', { scenarioVersion: '0.1.0', patient })).toBeNull();
    expect(neuromuscularRespiratoryFailureInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(neuromuscularRespiratoryFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(neuromuscularRespiratoryFailureInlinePrompt(level, { scenarioVersion: '0.1.0', patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
