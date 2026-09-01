/**
 * The worked example and observed-state tutor for the one lesson here where the
 * patient is not the first thing to protect.
 *
 * He is hypoxic and drowning in secretions, and he is also still wearing the
 * concentrate in a room where nobody is protected yet. Both the tutor and the
 * example argue that ordering rather than asserting it, refuse the mnemonic and
 * the cholinesterase report as ways of closing the pattern, and finish on a
 * chest that sounds better attached to a man who is no stronger.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { CHOLINERGIC_PESTICIDE_RESPIRATORY_FAILURE as SCENARIO } from '../../src/modules/toxicology/scenarios/cholinergic-pesticide-respiratory-failure';
import { CHOLINERGIC_FIXTURES as FIXTURES } from '../../src/modules/toxicology/cholinergic-pesticide-respiratory-failure-fixtures';
import {
  CHOLINERGIC_DEMONSTRATION_VERSION, cholinergicDemonstrationStep,
  supportsCholinergicDemonstration,
} from '../../src/modules/toxicology/demo/cholinergic-pesticide-respiratory-failure-demonstration';
import { cholinergicInlinePrompt } from '../../src/modules/toxicology/tutor/cholinergic-pesticide-respiratory-failure-guidance';
import type { CholinergicAction } from '../../src/modules/toxicology/cholinergic-pesticide-respiratory-failure';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyCholinergicAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CholinergicAction) => {
  engine.apply({ tick, type: 'cholinergic-pesticide-respiratory-failure-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = cholinergicDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'cholinergic-pesticide-respiratory-failure-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Protects The Room First', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CHOLINERGIC_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCholinergicDemonstration(SCENARIO)).toBe(true);
    expect(supportsCholinergicDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCholinergicDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'recognize', 'safety', 'evidence', 'report', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('treats the wet clothing as a finding about the room', () => {
    expect(narrations[beats.indexOf('trajectory')])
      .toContain('a finding about this room rather than a detail of his history');
  });

  it('argues the ordering rather than asserting it', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('not because he can wait');
    expect(safety).toContain('would make him wait far longer');
    expect(beats.indexOf('safety')).toBeLessThan(beats.indexOf('evidence'));
  });

  it('refuses the mnemonic and the cholinesterase report', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('they are not what kills him');
    expect(recognize).toContain('marks the exposure rather than grading him');
  });

  it('reads the secretions, bronchospasm and weakness as one problem', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('not four findings competing for attention');
    expect(evidence).toContain('early rather than eventual');
  });

  it('refuses to let drying secretions stand in for strength', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('have not moved');
    expect(handoff).toContain('Drying secretions is not neuromuscular recovery');
    expect(narration).toContain('no stronger than he was');
  });

  it('proves nothing, completes nothing, and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.cholinesteraseInterpretedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableVentilationProven).toBe(false);
    expect(patient.neuromuscularRecoveryProven).toBe(false);
    expect(patient.decontaminationCompleteProven).toBe(false);
    expect(patient.coWorkerSafetyProven).toBe(false);
    expect(patient.seizureExcluded).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['he is stable now', 'the decontamination is complete', 'his strength is back', 'the atropine worked']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('selects no protective equipment, washing method, drug, airway, or blocker anywhere', () => {
    expect(patient.ppeSelectedByLearner).toBe(false);
    expect(patient.decontaminationPerformedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.airwaySelectedByLearner).toBe(false);
    expect(patient.ventilationSelectedByLearner).toBe(false);
    expect(patient.neuromuscularBlockerSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 2 mg of atropine', 'use succinylcholine', 'a level c suit', 'irrigate with soap and water']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Says Why The Room Comes First', () => {
  it('opens with the clothing beside the saturation', () => {
    const engine = create(); engine.step();
    const prompt = cholinergicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', cholinergic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('cholinergic-trajectory');
    expect(prompt.because).toContain('a finding about this room');
  });

  it('names all three halves and refuses both shortcuts', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = cholinergicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', cholinergic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('cholinergic-recognize');
    expect(prompt.because).toContain('they are not what kills him');
    expect(prompt.because).toContain('marks the exposure rather than grading him');
  });

  it('gives the reason for protecting the room rather than the instruction', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = cholinergicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', cholinergic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('cholinergic-safety');
    expect(prompt.because).toContain('not because he can wait');
    expect(prompt.because).toContain('the co-workers still at the greenhouse');
  });

  it('makes the airway question early rather than eventual', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = cholinergicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', cholinergic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('cholinergic-evidence');
    expect(prompt.because).toContain('early rather than eventual');
    expect(prompt.because).toContain('selects no drug');
  });

  it('never calls him recovered, doses him, or picks a blocker', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = cholinergicInlinePrompt('guided', {
        scenarioVersion: '0.1.0', cholinergic: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['he is stable now', 'give 2 mg of atropine', 'use succinylcholine', 'his strength is back']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(cholinergicInlinePrompt('guided', { scenarioVersion: '0.1.0', cholinergic: patient })!.id)
      .toBe('cholinergic-observe');
    expect(cholinergicInlinePrompt('coached', { scenarioVersion: '0.1.0', cholinergic: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(cholinergicInlinePrompt('unassisted', { scenarioVersion: '0.1.0', cholinergic: patient })).toBeNull();
    expect(cholinergicInlinePrompt('guided', { scenarioVersion: '0.1.1', cholinergic: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(cholinergicInlinePrompt('guided', { scenarioVersion: '0.1.0', cholinergic: snapshot(engine) })).toBeNull();
  });
});
