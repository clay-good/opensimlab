/**
 * The worked example and observed-state tutor for a shock with two mechanisms
 * and a clock that has not finished running.
 *
 * Three numbers here are dramatic enough to be answered on their own — a
 * complete block at 34, a glucose of 238, a MAP of 47 — and both the tutor and
 * the example refuse all three closures in the same beat. The detail they keep
 * returning to is the formulation: extended release, five hours in, so the dose
 * is still arriving and the good forty-five minutes is a checkpoint rather than
 * a resolution.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { CALCIUM_CHANNEL_BLOCKER_SHOCK as SCENARIO } from '../../src/modules/toxicology/scenarios/calcium-channel-blocker-shock';
import { CALCIUM_CHANNEL_BLOCKER_FIXTURES as FIXTURES } from '../../src/modules/toxicology/calcium-channel-blocker-shock-fixtures';
import {
  CALCIUM_CHANNEL_BLOCKER_DEMONSTRATION_VERSION, calciumChannelBlockerDemonstrationStep,
  supportsCalciumChannelBlockerDemonstration,
} from '../../src/modules/toxicology/demo/calcium-channel-blocker-shock-demonstration';
import { calciumChannelBlockerInlinePrompt } from '../../src/modules/toxicology/tutor/calcium-channel-blocker-shock-guidance';
import type { CalciumChannelBlockerAction } from '../../src/modules/toxicology/calcium-channel-blocker-shock';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyCalciumChannelBlockerAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CalciumChannelBlockerAction) => {
  engine.apply({ tick, type: 'calcium-channel-blocker-shock-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = calciumChannelBlockerDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'calcium-channel-blocker-shock-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses Three Closures And One Ending', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CALCIUM_CHANNEL_BLOCKER_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCalciumChannelBlockerDemonstration(SCENARIO)).toBe(true);
    expect(supportsCalciumChannelBlockerDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCalciumChannelBlockerDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognize', 'support', 'evidence', 'report', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('refuses glucose-only, pulse-only and pacing-only closure together', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('answering either half alone leaves the other');
    expect(recognize).toContain('capture the rhythm while leaving both');
    expect(recognize).toContain('the same mistake three ways');
  });

  it('keeps the hyperglycemia supporting rather than grading', () => {
    expect(narrations[beats.indexOf('recognize')])
      .toContain('supports the pattern rather than grading him');
  });

  it('says the formulation before the numbers, and again at the end', () => {
    expect(narrations[beats.indexOf('trajectory')]).toContain('extended release');
    expect(narrations[beats.indexOf('trajectory')])
      .toContain('nothing here can be assumed to have peaked');
    expect(narrations[beats.indexOf('evidence')]).toContain('the dose is still arriving');
    expect(narrations[beats.indexOf('handoff')]).toContain('the absorption is not complete');
  });

  it('proves nothing, completes nothing, and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.absorptionComplete).toBe(false);
    expect(patient.durablePerfusionStabilityProven).toBe(false);
    expect(patient.glucoseStabilityProven).toBe(false);
    expect(patient.electrolyteStabilityProven).toBe(false);
    expect(patient.coingestionExcluded).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['he is stable now', 'the absorption is over', 'the shock has resolved', 'past the worst of it']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('selects no pacing, lipid, methylene blue, rescue, dose, or route anywhere', () => {
    expect(patient.pacingSelectedByLearner).toBe(false);
    expect(patient.rescueSelectedByLearner).toBe(false);
    expect(patient.rescueEligibilityDetermined).toBe(false);
    expect(patient.decontaminationSelectedByLearner).toBe(false);
    expect(patient.glucoseOrElectrolyteSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['pace him at', 'start lipid emulsion', 'give methylene blue', '3 grams of calcium']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Names Two Problems Before Any Number', () => {
  it('opens on the formulation and the clock', () => {
    const engine = create(); engine.step();
    const prompt = calciumChannelBlockerInlinePrompt('guided', {
      scenarioVersion: '0.1.0', calciumChannelBlocker: snapshot(engine),
    })!;
    expect(prompt.id).toBe('calcium-channel-blocker-trajectory');
    expect(prompt.because).toContain('not a detail of the history');
  });

  it('refuses all three closures in one prompt', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = calciumChannelBlockerInlinePrompt('guided', {
      scenarioVersion: '0.1.0', calciumChannelBlocker: snapshot(engine),
    })!;
    expect(prompt.id).toBe('calcium-channel-blocker-recognize');
    expect(prompt.because).toContain('the same mistake three ways');
    expect(prompt.because).toContain('while leaving both');
  });

  it('builds a room for a long night', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = calciumChannelBlockerInlinePrompt('guided', {
      scenarioVersion: '0.1.0', calciumChannelBlocker: snapshot(engine),
    })!;
    expect(prompt.id).toBe('calcium-channel-blocker-support');
    expect(prompt.because).toContain('the drug is still being absorbed');
  });

  it('puts the absorption clock beside the contractility and the tone', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = calciumChannelBlockerInlinePrompt('guided', {
      scenarioVersion: '0.1.0', calciumChannelBlocker: snapshot(engine),
    })!;
    expect(prompt.id).toBe('calcium-channel-blocker-evidence');
    expect(prompt.because).toContain('the dose is still arriving');
    expect(prompt.because).toContain('rather than at the arrest');
  });

  it('never calls him stable, calls the absorption over, or paces him', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = calciumChannelBlockerInlinePrompt('guided', {
        scenarioVersion: '0.1.0', calciumChannelBlocker: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['he is stable now', 'the absorption is over', 'pace him at', '3 grams of calcium']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(calciumChannelBlockerInlinePrompt('guided', { scenarioVersion: '0.1.0', calciumChannelBlocker: patient })!.id)
      .toBe('calcium-channel-blocker-observe');
    expect(calciumChannelBlockerInlinePrompt('coached', { scenarioVersion: '0.1.0', calciumChannelBlocker: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(calciumChannelBlockerInlinePrompt('unassisted', { scenarioVersion: '0.1.0', calciumChannelBlocker: patient })).toBeNull();
    expect(calciumChannelBlockerInlinePrompt('guided', { scenarioVersion: '0.1.1', calciumChannelBlocker: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(calciumChannelBlockerInlinePrompt('guided', { scenarioVersion: '0.1.0', calciumChannelBlocker: snapshot(engine) })).toBeNull();
  });
});
