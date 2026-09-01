/**
 * The worked example and observed-state tutor for a wide complex that is not
 * the rhythm problem it resembles.
 *
 * A regular wide-complex tachycardia with a low pressure comes with an obvious
 * script, and following it here is the harm. Both the tutor and the example
 * refuse QRS-only closure, assemble the room for the second seizure and the
 * second episode of hypotension rather than the first, and read the narrower
 * QRS at three hours as a response that can come back.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { TRICYCLIC_SODIUM_CHANNEL_CARDIOTOXICITY as SCENARIO } from '../../src/modules/toxicology/scenarios/tricyclic-sodium-channel-cardiotoxicity';
import { TRICYCLIC_FIXTURES as FIXTURES } from '../../src/modules/toxicology/tricyclic-sodium-channel-cardiotoxicity-fixtures';
import {
  TRICYCLIC_DEMONSTRATION_VERSION, tricyclicDemonstrationStep,
  supportsTricyclicDemonstration,
} from '../../src/modules/toxicology/demo/tricyclic-sodium-channel-cardiotoxicity-demonstration';
import { tricyclicInlinePrompt } from '../../src/modules/toxicology/tutor/tricyclic-sodium-channel-cardiotoxicity-guidance';
import type { TricyclicAction } from '../../src/modules/toxicology/tricyclic-sodium-channel-cardiotoxicity';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicologyTricyclicAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: TricyclicAction) => {
  engine.apply({ tick, type: 'tricyclic-sodium-channel-cardiotoxicity-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = tricyclicDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'tricyclic-sodium-channel-cardiotoxicity-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses The Obvious Script', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(TRICYCLIC_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsTricyclicDemonstration(SCENARIO)).toBe(true);
    expect(supportsTricyclicDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsTricyclicDemonstration({
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

  it('treats the presentation as one poisoning in several systems', () => {
    expect(narrations[beats.indexOf('trajectory')])
      .toContain('not a rhythm with a history attached');
  });

  it('refuses QRS-only closure and names the antiarrhythmic instinct as wrong', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('does not make the diagnosis alone');
    expect(recognize).toContain('stay coupled');
    expect(recognize).toContain('sodium-channel-blocking antiarrhythmic would be the wrong instinct');
  });

  it('assembles for the second seizure rather than the first', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('does not wait for the room to be ready');
    expect(beats.indexOf('support')).toBeLessThan(beats.indexOf('evidence'));
  });

  it('reads the narrower QRS as a response that can come back', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('neither proof the treatment caused it');
    expect(handoff).toContain('can recur');
    expect(narration).toContain('able to produce a second');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.ecgInterpretedByLearner).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableElectricalStabilityProven).toBe(false);
    expect(patient.seizureRecurrenceExcluded).toBe(false);
    expect(patient.coingestionExcluded).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is stable now', 'the bicarbonate worked', 'the toxicity has resolved', 'no further risk']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('selects no antiarrhythmic, airway, rescue, dose, or route anywhere', () => {
    expect(patient.rhythmTreatmentSelectedByLearner).toBe(false);
    expect(patient.airwaySelectedByLearner).toBe(false);
    expect(patient.ventilationSelectedByLearner).toBe(false);
    expect(patient.rescueSelectedByLearner).toBe(false);
    expect(patient.rescueEligibilityDetermined).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give amiodarone', '1 to 2 meq/kg', 'intubate her now', 'start lipid emulsion']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Keeps The Electrical Picture Coupled', () => {
  it('opens by putting the poisoning around the wide complex', () => {
    const engine = create(); engine.step();
    const prompt = tricyclicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', tricyclic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('tricyclic-trajectory');
    expect(prompt.because).toContain('not a rhythm with a history attached');
  });

  it('refuses to close on the QRS and names the wrong instinct', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = tricyclicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', tricyclic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('tricyclic-recognize');
    expect(prompt.because).toContain('does not make the diagnosis on its own');
    expect(prompt.because).toContain('wrong instinct');
  });

  it('assembles the room for what has not happened yet', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = tricyclicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', tricyclic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('tricyclic-support');
    expect(prompt.because).toContain('does not wait for you to be ready');
  });

  it('puts the rescue question on the table before the arrest', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = tricyclicInlinePrompt('guided', {
      scenarioVersion: '0.1.0', tricyclic: snapshot(engine),
    })!;
    expect(prompt.id).toBe('tricyclic-evidence');
    expect(prompt.because).toContain('rather than at the point of arrest');
    expect(prompt.because).toContain('selects no solution');
  });

  it('never calls her stable, doses her, or picks an antiarrhythmic', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = tricyclicInlinePrompt('guided', {
        scenarioVersion: '0.1.0', tricyclic: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['she is stable now', 'give amiodarone', '1 to 2 meq/kg', 'the toxicity has resolved']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(tricyclicInlinePrompt('guided', { scenarioVersion: '0.1.0', tricyclic: patient })!.id)
      .toBe('tricyclic-observe');
    expect(tricyclicInlinePrompt('coached', { scenarioVersion: '0.1.0', tricyclic: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(tricyclicInlinePrompt('unassisted', { scenarioVersion: '0.1.0', tricyclic: patient })).toBeNull();
    expect(tricyclicInlinePrompt('guided', { scenarioVersion: '0.1.1', tricyclic: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(tricyclicInlinePrompt('guided', { scenarioVersion: '0.1.0', tricyclic: snapshot(engine) })).toBeNull();
  });
});
