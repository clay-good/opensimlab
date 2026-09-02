/**
 * The worked example and observed-state tutor for a word that sounds like a
 * measurement.
 *
 * "Minor" is doing all the work in this case and none of it is arithmetic. An
 * NIHSS of 1 describes what was found; whether the deficit disables her is a
 * question about the life of a right-handed retired teacher who writes and uses
 * her phone. Both the tutor and the example say what she can still do alongside
 * what she has lost, and both keep the boundary revisable rather than settled.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MINOR_NONDISABLING_ACUTE_ISCHEMIC_STROKE as SCENARIO } from '../../src/modules/neurology/scenarios/minor-nondisabling-acute-ischemic-stroke';
import { MINOR_STROKE_FIXTURES as FIXTURES } from '../../src/modules/neurology/minor-nondisabling-acute-ischemic-stroke-fixtures';
import {
  MINOR_STROKE_DEMONSTRATION_VERSION, minorStrokeDemonstrationStep,
  supportsMinorStrokeDemonstration,
} from '../../src/modules/neurology/demo/minor-nondisabling-acute-ischemic-stroke-demonstration';
import { minorStrokeInlinePrompt } from '../../src/modules/neurology/tutor/minor-nondisabling-acute-ischemic-stroke-guidance';
import type { MinorStrokeAction } from '../../src/modules/neurology/minor-nondisabling-acute-ischemic-stroke';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyMinorStrokeAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MinorStrokeAction) => {
  engine.apply({ tick, type: 'minor-nondisabling-acute-ischemic-stroke-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = minorStrokeDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'minor-nondisabling-acute-ischemic-stroke-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Judges Function, Not The Score', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MINOR_STROKE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMinorStrokeDemonstration(SCENARIO)).toBe(true);
    expect(supportsMinorStrokeDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMinorStrokeDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'threats', 'boundary', 'intent', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.threatsAtTick!);
    expect(patient.threatsAtTick).toBeLessThan(patient.boundaryAtTick!);
    expect(patient.boundaryAtTick).toBeLessThan(patient.intentAtTick!);
    expect(patient.intentAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('says what she can still do alongside what she has lost', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('not just what she has lost');
    expect(opening).toContain('the second half is the one the decision turns on');
  });

  it('reads the imaging as what it says and the negatives as snapshots', () => {
    const threats = narrations[beats.indexOf('threats')]!;
    expect(threats).toContain('which is what the imaging says, not a mechanism');
    expect(threats).toContain('snapshots taken once');
    expect(threats).toContain('A score cannot stand in for any of this');
    expect(beats.indexOf('threats')).toBeLessThan(beats.indexOf('boundary'));
  });

  it('makes the boundary about her life and keeps it revisable', () => {
    const boundary = narrations[beats.indexOf('boundary')]!;
    expect(boundary).toContain('does not disable this woman in the life she actually leads');
    expect(boundary).toContain('revisited rather than settled');
    expect(patient.disabilityAdjudicatedByLearner).toBe(false);
    expect(patient.boundaryRevisable).toBe(true);
  });

  it('keeps the strategy an intent and gives surveillance a name', () => {
    const intent = narrations[beats.indexOf('intent')]!;
    expect(intent).toContain('follows the functional boundary rather than the other way round');
    expect(intent).toContain('depends on somebody noticing if it changes');
    expect(patient.antiplateletEligibilityDeterminedByLearner).toBe(false);
    expect(patient.thrombolysisEligibilityDeterminedByLearner).toBe(false);
  });

  it('separates a short window of stability from everything it is not', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('a short window of stability');
    expect(handoff).toContain('not a low recurrence risk');
    expect(narration).toContain('written down rather than settled');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.strokeMimicExcluded).toBe(false);
    expect(patient.strokeMechanismProven).toBe(false);
    expect(patient.etiologyProven).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.infarctResolutionProven).toBe(false);
    expect(patient.hemorrhagicTransformationExcluded).toBe(false);
    expect(patient.durableNeurologicStabilityProven).toBe(false);
    expect(patient.completeRecoveryProven).toBe(false);
    expect(patient.lowRecurrenceRiskProven).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is a lacunar stroke', 'her deficit has resolved', 'she is not disabled', 'she can be discharged']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('scores nobody and selects no product, dose, duration, or route anywhere', () => {
    expect(patient.scoreCalculatedByLearner).toBe(false);
    expect(patient.neurologicExamPerformedByLearner).toBe(false);
    expect(patient.imagingInterpretedByLearner).toBe(false);
    expect(patient.productSelectedByLearner).toBe(false);
    expect(patient.combinationSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.durationSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.bloodPressureTargetSelectedByLearner).toBe(false);
    expect(patient.dispositionDeterminedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start aspirin 300 mg', 'dual antiplatelet for 21 days', 'give thrombolysis', 'target a pressure of']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Keeps The Score Away From The Decision', () => {
  it('opens on what she can still do', () => {
    const engine = create(); engine.step();
    const prompt = minorStrokeInlinePrompt('guided', {
      scenarioVersion: '0.1.0', minorStroke: snapshot(engine),
    })!;
    expect(prompt.id).toBe('minor-stroke-trajectory');
    expect(prompt.because).toContain('the second half is the one the decision turns on');
  });

  it('refuses to let a score stand in for the imaging and the mimics', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = minorStrokeInlinePrompt('guided', {
      scenarioVersion: '0.1.0', minorStroke: snapshot(engine),
    })!;
    expect(prompt.id).toBe('minor-stroke-threats');
    expect(prompt.because).toContain('snapshots taken once');
    expect(prompt.because).toContain('A score cannot stand in for any of this');
  });

  it('names the two words that make the boundary honest', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = minorStrokeInlinePrompt('guided', {
      scenarioVersion: '0.1.0', minorStroke: snapshot(engine),
    })!;
    expect(prompt.id).toBe('minor-stroke-boundary');
    expect(prompt.because).toContain('a conversation with her rather than a number from you');
    expect(prompt.because).toContain('"To date" and "revisable"');
  });

  it('keeps the strategy qualified and determines no eligibility', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = minorStrokeInlinePrompt('guided', {
      scenarioVersion: '0.1.0', minorStroke: snapshot(engine),
    })!;
    expect(prompt.id).toBe('minor-stroke-intent');
    expect(prompt.because).toContain('neither thrombolysis nor antiplatelet eligibility is determined');
  });

  it('never adjudicates disability, excludes a mimic, or doses her', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = minorStrokeInlinePrompt('guided', {
        scenarioVersion: '0.1.0', minorStroke: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is a lacunar stroke', 'she is not disabled', 'start aspirin 300 mg', 'she can be discharged']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(minorStrokeInlinePrompt('guided', { scenarioVersion: '0.1.0', minorStroke: patient })!.id)
      .toBe('minor-stroke-later');
    expect(minorStrokeInlinePrompt('coached', { scenarioVersion: '0.1.0', minorStroke: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(minorStrokeInlinePrompt('unassisted', { scenarioVersion: '0.1.0', minorStroke: patient })).toBeNull();
    expect(minorStrokeInlinePrompt('guided', { scenarioVersion: '0.1.1', minorStroke: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(minorStrokeInlinePrompt('guided', { scenarioVersion: '0.1.0', minorStroke: snapshot(engine) })).toBeNull();
  });
});
