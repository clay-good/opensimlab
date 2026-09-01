/**
 * The worked example and observed-state tutor for four numbers that only mean
 * something together.
 *
 * A level of 8.6, a potassium of 6.1, a complete block and an escape rate of 36
 * each look like the headline. Both the tutor and the example refuse all four
 * closures, treat the potassium as a marker of poisoning rather than an
 * electrolyte problem, and finish on the number that is deliberately absent:
 * after immune Fab a standard total digoxin assay would mislead, so there is no
 * repeat level and the absence is what gets handed over.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { DIGOXIN_RHYTHM_POTASSIUM as SCENARIO } from '../../src/modules/toxicology/scenarios/digoxin-rhythm-potassium';
import { DIGOXIN_FIXTURES as FIXTURES } from '../../src/modules/toxicology/digoxin-rhythm-potassium-fixtures';
import {
  DIGOXIN_DEMONSTRATION_VERSION, digoxinDemonstrationStep,
  supportsDigoxinDemonstration,
} from '../../src/modules/toxicology/demo/digoxin-rhythm-potassium-demonstration';
import { digoxinInlinePrompt } from '../../src/modules/toxicology/tutor/digoxin-rhythm-potassium-guidance';
import type { DigoxinAction } from '../../src/modules/toxicology/digoxin-rhythm-potassium';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyDigoxinAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: DigoxinAction) => {
  engine.apply({ tick, type: 'digoxin-rhythm-potassium-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = digoxinDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'digoxin-rhythm-potassium-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses Four Closures And One Number', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(DIGOXIN_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDigoxinDemonstration(SCENARIO)).toBe(true);
    expect(supportsDigoxinDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsDigoxinDemonstration({
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

  it('keeps the vomiting and the yellow vision inside the poisoning', () => {
    expect(narrations[beats.indexOf('trajectory')])
      .toContain('part of the poisoning rather than background noise');
  });

  it('refuses all four closures and names the pacing trap', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('none of them is the whole finding');
    expect(recognize).toContain('capture a rhythm in a poisoned myocardium and leave the poisoning');
  });

  it('treats the potassium as a marker rather than an electrolyte problem', () => {
    expect(narrations[beats.indexOf('recognize')])
      .toContain('rather than an electrolyte problem standing on its own');
    expect(narrations[beats.indexOf('evidence')])
      .toContain('about to become the opposite problem');
  });

  it('reads the level with the sampling clock that makes it interpretable', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('seven hours after the last dose and before any antidote');
    expect(evidence).toContain('which is what lets it mean anything');
  });

  it('hands over the missing number as a finding rather than a gap', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('deliberately no repeat digoxin concentration');
    expect(handoff).toContain('measures bound drug');
    expect(narration).toContain('a laboratory number nobody should trust for a while');
  });

  it('proves nothing, resolves nothing, and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.levelInterpretedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durablePerfusionStabilityProven).toBe(false);
    expect(patient.potassiumStabilityProven).toBe(false);
    expect(patient.assayInterferenceResolved).toBe(false);
    expect(patient.coingestionExcluded).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is stable now', 'the fab worked', 'the toxicity has resolved', 'correct the potassium']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('selects no vial count, electrolyte, pacing, dialysis, or antiarrhythmic anywhere', () => {
    expect(patient.vialCountSelectedByLearner).toBe(false);
    expect(patient.glucoseOrElectrolyteSelectedByLearner).toBe(false);
    expect(patient.pacingSelectedByLearner).toBe(false);
    expect(patient.dialysisSelectedByLearner).toBe(false);
    expect(patient.rescueSelectedByLearner).toBe(false);
    expect(patient.antidoteEligibilityDetermined).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give ten vials', 'pace her at', 'give calcium', 'start insulin and dextrose']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Reads Four Numbers Together', () => {
  it('opens with the gastrointestinal and visual findings beside the rhythm', () => {
    const engine = create(); engine.step();
    const prompt = digoxinInlinePrompt('guided', {
      scenarioVersion: '0.1.0', digoxin: snapshot(engine),
    })!;
    expect(prompt.id).toBe('digoxin-trajectory');
    expect(prompt.because).toContain('rather than background noise');
  });

  it('refuses all four closures in one prompt', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = digoxinInlinePrompt('guided', {
      scenarioVersion: '0.1.0', digoxin: snapshot(engine),
    })!;
    expect(prompt.id).toBe('digoxin-recognize');
    expect(prompt.because).toContain('none of them is the whole finding');
    expect(prompt.because).toContain('leave the poisoning');
    expect(prompt.because).toContain('rather than an electrolyte problem standing on its own');
  });

  it('assembles for an arrhythmia that has not happened yet', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = digoxinInlinePrompt('guided', {
      scenarioVersion: '0.1.0', digoxin: snapshot(engine),
    })!;
    expect(prompt.id).toBe('digoxin-support');
    expect(prompt.because).toContain('reasons to build the room now');
  });

  it('reads the level with its clock and the potassium as a trajectory', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = digoxinInlinePrompt('guided', {
      scenarioVersion: '0.1.0', digoxin: snapshot(engine),
    })!;
    expect(prompt.id).toBe('digoxin-evidence');
    expect(prompt.because).toContain('which is what lets it mean anything');
    expect(prompt.because).toContain('immune Fab pulls it down quickly');
  });

  it('never calls her stable, corrects the potassium, or quotes a post-Fab level', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = digoxinInlinePrompt('guided', {
        scenarioVersion: '0.1.0', digoxin: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['she is stable now', 'correct the potassium', 'give ten vials', 'the repeat level']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(digoxinInlinePrompt('guided', { scenarioVersion: '0.1.0', digoxin: patient })!.id)
      .toBe('digoxin-observe');
    expect(digoxinInlinePrompt('coached', { scenarioVersion: '0.1.0', digoxin: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(digoxinInlinePrompt('unassisted', { scenarioVersion: '0.1.0', digoxin: patient })).toBeNull();
    expect(digoxinInlinePrompt('guided', { scenarioVersion: '0.1.1', digoxin: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(digoxinInlinePrompt('guided', { scenarioVersion: '0.1.0', digoxin: snapshot(engine) })).toBeNull();
  });
});
