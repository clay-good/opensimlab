/**
 * The worked example and observed-state tutor for a pattern that assembled in
 * twelve minutes.
 *
 * Consciousness, pupil and motor response all changed together, and that
 * convergence is the diagnosis. A complete Cushing triad is not required and
 * the CT was taken before the decline, so both the tutor and the example refuse
 * to wait for a sign that has not arrived or a scan that would repeat.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_TRANSTENTORIAL_HERNIATION_PATTERN as SCENARIO } from '../../src/modules/neurology/scenarios/acute-transtentorial-herniation-pattern';
import { HERNIATION_FIXTURES as FIXTURES } from '../../src/modules/neurology/acute-transtentorial-herniation-pattern-fixtures';
import {
  HERNIATION_DEMONSTRATION_VERSION, herniationDemonstrationStep,
  supportsHerniationDemonstration,
} from '../../src/modules/neurology/demo/acute-transtentorial-herniation-pattern-demonstration';
import { herniationInlinePrompt } from '../../src/modules/neurology/tutor/acute-transtentorial-herniation-pattern-guidance';
import type { HerniationAction } from '../../src/modules/neurology/acute-transtentorial-herniation-pattern';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyHerniationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: HerniationAction) => {
  engine.apply({ tick, type: 'acute-transtentorial-herniation-pattern-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = herniationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'acute-transtentorial-herniation-pattern-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Wait For One More Sign', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(HERNIATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHerniationDemonstration(SCENARIO)).toBe(true);
    expect(supportsHerniationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsHerniationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'ownership', 'boundary', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.boundaryAtTick!);
    expect(patient.boundaryAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('states four changes and the twelve minutes they occupied', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('inside twelve minutes');
    expect(opening).toContain('in isolation has a long differential');
  });

  it('refuses to wait for the sign that has not arrived', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('the respiratory irregularity is not required');
    expect(recognition).toContain('not a threshold for acting');
    expect(recognition).toContain('cannot be taken back');
    expect(patient.convergingPatternRecognized).toBe(true);
  });

  it('calls the airway and the operating room in the same breath', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('belongs with the rescue rather than after it');
    expect(ownership).toContain('takes longer to arrange than anything else');
    expect(beats.indexOf('recognition')).toBeLessThan(beats.indexOf('ownership'));
    expect(patient.qualifiedOwnershipActive).toBe(true);
  });

  it('reads the CT as pre-decline context rather than a current picture', () => {
    const boundary = narrations[beats.indexOf('boundary')]!;
    expect(boundary).toContain('immediately before the steep decline');
    expect(boundary).toContain('rather than the one he is in');
    expect(boundary).toContain('Repeat imaging does not come before any of it');
    expect(patient.qualifiedBrainRescueBoundaryReviewed).toBe(true);
  });

  it('hands off everything started and nothing yet achieved', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('still 6 mm and nonreactive');
    expect(handoff).toContain('none of it has worked yet');
    expect(narration).toContain('nothing yet achieved');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.neurologicRecoveryProven).toBe(false);
    expect(patient.durablePressureControlProven).toBe(false);
    expect(patient.definitiveSourceControlProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.laterQualifiedRescueAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the rescue worked', 'his pupil is reacting', 'wait for the cushing triad', 'repeat the scan first']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('scores nobody and performs no airway or procedure anywhere', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.patientHistoryTakenByLearner).toBe(false);
    expect(patient.scoreCalculatedByLearner).toBe(false);
    expect(patient.imagingInterpretedByLearner).toBe(false);
    expect(patient.airwayProcedurePerformedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.procedureSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 3% saline', 'intubate him yourself', 'calculate the gcs', 'take him for craniectomy']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Names It On What Already Changed', () => {
  it('opens on four changes inside twelve minutes', () => {
    const engine = create(); engine.step();
    const prompt = herniationInlinePrompt('guided', {
      scenarioVersion: '0.1.0', herniation: snapshot(engine),
    })!;
    expect(prompt.id).toBe('herniation-trajectory');
    expect(prompt.because).toContain('inside twelve minutes');
  });

  it('refuses to wait for the sign that has not arrived', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = herniationInlinePrompt('guided', {
      scenarioVersion: '0.1.0', herniation: snapshot(engine),
    })!;
    expect(prompt.id).toBe('herniation-recognition');
    expect(prompt.suggestion).toContain('do not wait for the sign that has not arrived');
    expect(prompt.because).toContain('the respiratory irregularity is not required');
    expect(prompt.because).toContain('cannot be taken back');
  });

  it('calls the airway and the operating room together', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = herniationInlinePrompt('guided', {
      scenarioVersion: '0.1.0', herniation: snapshot(engine),
    })!;
    expect(prompt.id).toBe('herniation-ownership');
    expect(prompt.because).toContain('belongs with the rescue rather than after it');
    expect(prompt.because).toContain('takes longer to arrange than anything else');
  });

  it('reads the CT as pre-decline context', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = herniationInlinePrompt('guided', {
      scenarioVersion: '0.1.0', herniation: snapshot(engine),
    })!;
    expect(prompt.id).toBe('herniation-boundary');
    expect(prompt.because).toContain('immediately before the steep decline');
    expect(prompt.because).toContain('Repeat imaging does not come before any of it');
  });

  it('never claims the rescue worked, waits for the triad, or picks a procedure', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = herniationInlinePrompt('guided', {
        scenarioVersion: '0.1.0', herniation: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the rescue worked', 'his pupil is reacting', 'wait for the cushing triad', 'give 3% saline']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(herniationInlinePrompt('guided', { scenarioVersion: '0.1.0', herniation: patient })!.id)
      .toBe('herniation-later');
    expect(herniationInlinePrompt('coached', { scenarioVersion: '0.1.0', herniation: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(herniationInlinePrompt('unassisted', { scenarioVersion: '0.1.0', herniation: patient })).toBeNull();
    expect(herniationInlinePrompt('guided', { scenarioVersion: '0.1.1', herniation: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(herniationInlinePrompt('guided', { scenarioVersion: '0.1.0', herniation: snapshot(engine) })).toBeNull();
  });
});
