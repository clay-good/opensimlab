/**
 * The worked example and observed-state tutor for a number that is a case fact
 * rather than a rule.
 *
 * 850 mL came off before cough and tightness stopped it. That volume is what
 * happened to this patient; the stop was symptom-led.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { LARGE_UNILATERAL_PLEURAL_EFFUSION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/large-unilateral-pleural-effusion-reassessment';
import { LARGE_PLEURAL_EFFUSION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/large-unilateral-pleural-effusion-reassessment-fixtures';
import {
  LARGE_PLEURAL_EFFUSION_DEMONSTRATION_VERSION, largePleuralEffusionDemonstrationStep,
  supportsLargePleuralEffusionDemonstration,
} from '../../src/modules/respiratory-medicine/demo/large-unilateral-pleural-effusion-reassessment-demonstration';
import { largePleuralEffusionInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/large-unilateral-pleural-effusion-reassessment-guidance';
import type { LargePleuralEffusionAction } from '../../src/modules/respiratory-medicine/large-unilateral-pleural-effusion-reassessment';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.largePleuralEffusionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: LargePleuralEffusionAction) => {
  engine.apply({ tick, type: 'large-unilateral-pleural-effusion-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = largePleuralEffusionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'large-unilateral-pleural-effusion-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Keeps 850 mL A Case Fact', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(LARGE_PLEURAL_EFFUSION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsLargePleuralEffusionDemonstration(SCENARIO)).toBe(true);
    expect(supportsLargePleuralEffusionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsLargePleuralEffusionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all five recorded steps in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'intent', 'response', 'fluid', 'evaluation', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.intentAtTick!);
    expect(patient.intentAtTick).toBeLessThan(patient.responseAtTick!);
    expect(patient.responseAtTick).toBeLessThan(patient.fluidAtTick!);
    expect(patient.fluidAtTick).toBeLessThan(patient.evaluationAtTick!);
    expect(patient.evaluationAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads six weeks of decline as a different kind of urgency', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('a large problem that has arrived slowly');
    expect(trajectory).toContain('a different kind of urgency');
    expect(patient.largeUnilateralEffusionAuthored).toBe(true);
    expect(patient.tensionPhysiologyAuthored).toBe(false);
  });

  it('makes the aspiration intent about its terms rather than its existence', () => {
    const intent = narrations[beats.indexOf('intent')]!;
    expect(intent).toContain('The terms are the substance here');
    expect(intent).toContain('a different procedure from one that stops at a number');
    expect(intent).toContain('establish neither urgency nor safety nor a cause');
  });

  it('names the 850 mL as a case fact rather than a maximum', () => {
    const response = narrations[beats.indexOf('response')]!;
    expect(response).toContain('The 850 mL is what happened, not a maximum to carry to the next patient');
    expect(response).toContain('the stop was driven by her symptoms');
    expect(response).toContain('proves complete drainage');
  });

  it('takes the exudative classification as a narrowing rather than an answer', () => {
    const fluid = narrations[beats.indexOf('fluid')]!;
    expect(fluid).toContain('rules a transudate unlikely and rules nothing in');
    expect(fluid).toContain('The pattern diagnoses nothing.');
  });

  it('gives the pending results an owner before she leaves the room', () => {
    const evaluation = narrations[beats.indexOf('evaluation')]!;
    expect(evaluation).toContain('come back to somebody');
    expect(evaluation).toContain('quietly becomes a patient nobody is following up');
  });

  it('ends on a symptom that improved and a cause that has not been found', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('what it narrows rather than settles');
    expect(handoff).toContain('the results still pending');
    expect(narration).toContain('results somebody else will read');
    expect(narration).toContain('This ends the example, not the investigation.');
  });

  it('delivers nothing, selects nothing, and predicts nothing', () => {
    expect(patient.examinationPerformedByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.ultrasoundPerformedByLearner).toBe(false);
    expect(patient.pleuralFluidAcquiredByLearner).toBe(false);
    expect(patient.fluidInterpretedByLearner).toBe(false);
    expect(patient.thoracentesisPerformedByLearner).toBe(false);
    expect(patient.deviceOrSiteSelected).toBe(false);
    expect(patient.drainageVolumeSelected).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.diagnosisDetermined).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is malignant', 'the effusion is drained', 'she has tuberculosis', 'the cause is']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    for (const forbidden of ['drain 1.5 litres', 'take off a litre', 'never remove more than', 'put in a chest drain']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Keeps 850 mL A Case Fact', () => {
  it('opens on six weeks against right now', () => {
    const engine = create(); engine.step();
    const prompt = largePleuralEffusionInlinePrompt('guided', { scenarioVersion: '0.1.0', largePleuralEffusion: snapshot(engine) })!;
    expect(prompt.id).toBe('effusion-trajectory');
    expect(prompt.suggestion).toContain('six weeks of decline against how she is right now');
    expect(prompt.because).toContain('a different kind of urgency');
  });

  it('records the aspiration terms next', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = largePleuralEffusionInlinePrompt('guided', { scenarioVersion: '0.1.0', largePleuralEffusion: snapshot(engine) })!;
    expect(prompt.id).toBe('effusion-intent');
    expect(prompt.suggestion).toContain('on what terms');
    expect(prompt.because).toContain('The terms are the substance here');
  });

  it('keeps the 850 mL a case fact', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = largePleuralEffusionInlinePrompt('guided', { scenarioVersion: '0.1.0', largePleuralEffusion: snapshot(engine) })!;
    expect(prompt.id).toBe('effusion-response');
    expect(prompt.suggestion).toContain('the volume as a fact rather than a target');
    expect(prompt.because).toContain('not a maximum to carry to the next patient');
  });

  it('narrows without diagnosing on the fluid pattern', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = largePleuralEffusionInlinePrompt('guided', { scenarioVersion: '0.1.0', largePleuralEffusion: snapshot(engine) })!;
    expect(prompt.id).toBe('effusion-fluid');
    expect(prompt.suggestion).toContain('a narrowing, not an answer');
    expect(prompt.because).toContain('rules a transudate unlikely and rules nothing in');
  });

  it('never names a cause, claims drainage, or sets a volume', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = largePleuralEffusionInlinePrompt('guided', { scenarioVersion: '0.1.0', largePleuralEffusion: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['this is malignant', 'the effusion is drained', 'never remove more than', 'the cause is']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(largePleuralEffusionInlinePrompt('unassisted', { scenarioVersion: '0.1.0', largePleuralEffusion: patient })).toBeNull();
    expect(largePleuralEffusionInlinePrompt('guided', { scenarioVersion: '0.1.1', largePleuralEffusion: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(largePleuralEffusionInlinePrompt('guided', { scenarioVersion: '0.1.0', largePleuralEffusion: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(largePleuralEffusionInlinePrompt(level, { scenarioVersion: '0.1.0', largePleuralEffusion: snapshot(engine) })).not.toBeNull();
    }
  });
});
