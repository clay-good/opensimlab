/**
 * The worked example and observed-state tutor for a diagnosis that lives in the
 * baseline.
 *
 * An eighty-two-year-old with fluctuating confusion is read as dementia unless
 * somebody establishes who she was this morning. Both the tutor and the example
 * anchor there, and both refuse a single cause: the six-hour review returns six
 * ordinary contributors and no culprit.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_DELIRIUM_REVERSIBLE_CAUSES as SCENARIO } from '../../src/modules/neurology/scenarios/acute-delirium-reversible-causes';
import { DELIRIUM_FIXTURES as FIXTURES } from '../../src/modules/neurology/acute-delirium-reversible-causes-fixtures';
import {
  DELIRIUM_DEMONSTRATION_VERSION, deliriumDemonstrationStep,
  supportsDeliriumDemonstration,
} from '../../src/modules/neurology/demo/acute-delirium-reversible-causes-demonstration';
import { deliriumInlinePrompt } from '../../src/modules/neurology/tutor/acute-delirium-reversible-causes-guidance';
import type { DeliriumAction } from '../../src/modules/neurology/acute-delirium-reversible-causes';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyDeliriumAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: DeliriumAction) => {
  engine.apply({ tick, type: 'acute-delirium-reversible-causes-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = deliriumDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'acute-delirium-reversible-causes-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Anchors On The Baseline', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(DELIRIUM_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDeliriumDemonstration(SCENARIO)).toBe(true);
    expect(supportsDeliriumDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsDeliriumDemonstration({
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

  it('starts from who she was this morning and counts the quiet stretches in', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('let her daughter tell you');
    expect(opening).toContain('the half that gets recorded as settled');
  });

  it('refuses both the dementia label and the single cause', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('not a diagnosis you calculate');
    expect(recognition).toContain('or a dementia label');
    expect(recognition).toContain('And it is not one cause either');
    expect(patient.qualifiedAssessmentBoundaryRecognized).toBe(true);
  });

  it('names the daughter as part of the care rather than a visitor', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('mostly not medical');
    expect(ownership).toContain('part of the care rather than a visitor');
    expect(beats.indexOf('recognition')).toBeLessThan(beats.indexOf('ownership'));
    expect(patient.qualifiedOwnershipActive).toBe(true);
  });

  it('works the ordinary contributors and keeps safety least-restrictive', () => {
    const boundary = narrations[beats.indexOf('boundary')]!;
    expect(boundary).toContain('hearing aids are in the bedside drawer');
    expect(boundary).toContain('least-restrictive safety come before anything else');
    expect(patient.qualifiedContributorBoundaryReviewed).toBe(true);
  });

  it('hands off six contributors and names no cause', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('690 mL in her bladder');
    expect(handoff).toContain('improvement without resolution');
    expect(handoff).toContain('name no single cause');
    expect(narration).toContain('none of them called the cause');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.singleCauseProven).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.cognitiveRecoveryProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.laterContributorsAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is dementia', 'the urine is the cause', 'her delirium has resolved', 'she lacks capacity']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('scores nobody and selects no restraint, observation level, or drug anywhere', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.patientHistoryTakenByLearner).toBe(false);
    expect(patient.scoreCalculatedByLearner).toBe(false);
    expect(patient.capacityAssessedByLearner).toBe(false);
    expect(patient.restraintSelectedByLearner).toBe(false);
    expect(patient.observationSelectedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give haloperidol', 'use bed rails', 'start one-to-one observation', 'calculate the 4at']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Starts From Who She Was', () => {
  it('opens on the baseline her daughter can describe', () => {
    const engine = create(); engine.step();
    const prompt = deliriumInlinePrompt('guided', {
      scenarioVersion: '0.1.0', delirium: snapshot(engine),
    })!;
    expect(prompt.id).toBe('delirium-trajectory');
    expect(prompt.because).toContain('the half that gets recorded as settled');
  });

  it('refuses the dementia label and the single cause', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = deliriumInlinePrompt('guided', {
      scenarioVersion: '0.1.0', delirium: snapshot(engine),
    })!;
    expect(prompt.id).toBe('delirium-recognition');
    expect(prompt.suggestion).toContain('refuse both easy closures');
    expect(prompt.because).toContain('or a dementia label');
    expect(prompt.because).toContain('And it is not one cause either');
  });

  it('names the work as mostly not medical', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = deliriumInlinePrompt('guided', {
      scenarioVersion: '0.1.0', delirium: snapshot(engine),
    })!;
    expect(prompt.id).toBe('delirium-ownership');
    expect(prompt.because).toContain('are the intervention here');
    expect(prompt.because).toContain('part of the care rather than a visitor');
  });

  it('keeps safety least-restrictive', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = deliriumInlinePrompt('guided', {
      scenarioVersion: '0.1.0', delirium: snapshot(engine),
    })!;
    expect(prompt.id).toBe('delirium-boundary');
    expect(prompt.because).toContain('hearing aids are in the bedside drawer');
    expect(prompt.because).toContain('no restraint, no observation level and no drug');
  });

  it('never calls it dementia, names one cause, or picks a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = deliriumInlinePrompt('guided', {
        scenarioVersion: '0.1.0', delirium: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is dementia', 'the urine is the cause', 'her delirium has resolved', 'give haloperidol']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(deliriumInlinePrompt('guided', { scenarioVersion: '0.1.0', delirium: patient })!.id)
      .toBe('delirium-later');
    expect(deliriumInlinePrompt('coached', { scenarioVersion: '0.1.0', delirium: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(deliriumInlinePrompt('unassisted', { scenarioVersion: '0.1.0', delirium: patient })).toBeNull();
    expect(deliriumInlinePrompt('guided', { scenarioVersion: '0.1.1', delirium: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(deliriumInlinePrompt('guided', { scenarioVersion: '0.1.0', delirium: snapshot(engine) })).toBeNull();
  });
});
