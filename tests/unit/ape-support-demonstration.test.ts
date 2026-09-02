/**
 * The worked example and observed-state tutor for a patient failing on
 * treatment that worked.
 *
 * Her pressure came down from 196/118 to 108/68 and her breathing gave out
 * underneath it. The falling respiratory rate is fatigue, not improvement.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_PULMONARY_EDEMA_RESPIRATORY_SUPPORT_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/acute-pulmonary-edema-respiratory-support-reassessment';
import { APE_SUPPORT_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/acute-pulmonary-edema-respiratory-support-reassessment-fixtures';
import {
  APE_SUPPORT_DEMONSTRATION_VERSION, apeSupportDemonstrationStep,
  supportsApeSupportDemonstration,
} from '../../src/modules/respiratory-medicine/demo/acute-pulmonary-edema-respiratory-support-reassessment-demonstration';
import { apeSupportInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/acute-pulmonary-edema-respiratory-support-reassessment-guidance';
import type { ApeSupportAction } from '../../src/modules/respiratory-medicine/acute-pulmonary-edema-respiratory-support-reassessment';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.apeSupportAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: ApeSupportAction) => {
  engine.apply({ tick, type: 'acute-pulmonary-edema-respiratory-support-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = apeSupportDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'acute-pulmonary-edema-respiratory-support-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads The Quieter Breath', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(APE_SUPPORT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsApeSupportDemonstration(SCENARIO)).toBe(true);
    expect(supportsApeSupportDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsApeSupportDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all five recorded steps in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'failure', 'whole-patient', 'escalation', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.failureAtTick!);
    expect(patient.failureAtTick).toBeLessThan(patient.wholePatientAtTick!);
    expect(patient.wholePatientAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(patient.escalationAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('separates the correct initial care from where she has ended up', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('That is the right care, delivered by someone else');
    expect(trajectory).toContain('her pressure has come down to 108/68');
    expect(trajectory).toContain('what the rest of her has done since');
    expect(patient.pulmonaryEdemaAuthored).toBe(true);
    expect(patient.supportAlreadyActiveAuthored).toBe(true);
  });

  it('reads the falling respiratory rate as fatigue', () => {
    const failure = narrations[beats.indexOf('failure')]!;
    expect(failure).toContain('The rate fell because she is tiring, not because she is better.');
    expect(failure).toContain('during noninvasive support that is reportedly running');
    expect(failure).toContain('the specific situation the support does not fix');
  });

  it('reads the treated pressure as afterload rather than shock', () => {
    const whole = narrations[beats.indexOf('whole-patient')]!;
    expect(whole).toContain('a treated afterload rather than shock');
    expect(whole).toContain('the congestion has not resolved either');
    expect(whole).toContain('permanently excludes a change');
  });

  it('escalates for a failure that has already been established', () => {
    const escalation = narrations[beats.indexOf('escalation')]!;
    expect(escalation).toContain('rather than a request to help decide');
    expect(escalation).toContain('deteriorating through it, which is the indication');
    expect(escalation).toContain('rather than summoned once the decision is unavoidable');
    // Uniquely in this module the escalation follows the cause review.
    expect(beats.indexOf('whole-patient')).toBeLessThan(beats.indexOf('escalation'));
  });

  it('ends on a deterioration that treatment did not stop', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the precipitants still open');
    expect(handoff).toContain('the airway-capable help that is now involved');
    expect(narration).toContain('tiring through support that is already running');
    expect(narration).toContain('This ends the example, not the deterioration.');
  });

  it('delivers nothing, selects nothing, and predicts nothing', () => {
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.nivStartedByLearner).toBe(false);
    expect(patient.supportSettingSelected).toBe(false);
    expect(patient.medicationDeliveredByLearner).toBe(false);
    expect(patient.testAcquiredByLearner).toBe(false);
    expect(patient.airwayProcedurePerformedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is improving', 'the edema has cleared', 'this is an infarct', 'she is in shock']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    for (const forbidden of ['turn the peep up', 'give more furosemide', 'intubate her now', 'switch to cpap']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads The Quieter Breath', () => {
  it('opens by separating the care from the trajectory', () => {
    const engine = create(); engine.step();
    const prompt = apeSupportInlinePrompt('guided', { scenarioVersion: '0.1.0', apeSupport: snapshot(engine) })!;
    expect(prompt.id).toBe('ape-trajectory');
    expect(prompt.suggestion).toContain('Separate what the team did from where she has ended up');
    expect(prompt.because).toContain('what the rest of her has done since');
  });

  it('names the failure from the whole picture next', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = apeSupportInlinePrompt('guided', { scenarioVersion: '0.1.0', apeSupport: snapshot(engine) })!;
    expect(prompt.id).toBe('ape-failure');
    expect(prompt.suggestion).toContain('the mentation, the effort and the gas together');
    expect(prompt.because).toContain('The rate fell because she is tiring, not because she is better.');
  });

  it('reads the pressure as treated afterload', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = apeSupportInlinePrompt('guided', { scenarioVersion: '0.1.0', apeSupport: snapshot(engine) })!;
    expect(prompt.id).toBe('ape-whole-patient');
    expect(prompt.suggestion).toContain('keep the precipitants open');
    expect(prompt.because).toContain('a treated afterload rather than shock');
  });

  it('escalates after the review rather than before it', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = apeSupportInlinePrompt('guided', { scenarioVersion: '0.1.0', apeSupport: snapshot(engine) })!;
    expect(prompt.id).toBe('ape-escalation');
    expect(prompt.because).toContain('rather than a request to help decide');
    expect(prompt.because).toContain('deteriorating through it, which is the indication');
  });

  it('never claims improvement, names a cause, or touches the support', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = apeSupportInlinePrompt('guided', { scenarioVersion: '0.1.0', apeSupport: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['she is improving', 'this is an infarct', 'turn the peep up', 'intubate her now']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(apeSupportInlinePrompt('unassisted', { scenarioVersion: '0.1.0', apeSupport: patient })).toBeNull();
    expect(apeSupportInlinePrompt('guided', { scenarioVersion: '0.1.1', apeSupport: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(apeSupportInlinePrompt('guided', { scenarioVersion: '0.1.0', apeSupport: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(apeSupportInlinePrompt(level, { scenarioVersion: '0.1.0', apeSupport: snapshot(engine) })).not.toBeNull();
    }
  });
});
