/**
 * The worked example and observed-state tutor for a score that cannot exclude.
 *
 * Three of the refused shortcuts are the same error with different instruments —
 * a laboratory score, an absent physical sign, an image — each read as a
 * rule-out. Both answer them with the sensitivities rather than with alarm, and
 * the example asks for surgical review before the limb has progressed, which is
 * the only point at which the decision is actually hard.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NECROTIZING_INFECTION_SCORE_CANNOT_EXCLUDE as SCENARIO } from '../../src/modules/infectious-disease/scenarios/necrotizing-infection-score-cannot-exclude';
import { NECROTIZING_INFECTION_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/necrotizing-infection-fixtures';
import {
  NECROTIZING_INFECTION_DEMONSTRATION_VERSION, necrotizingInfectionDemonstrationStep,
  supportsNecrotizingInfectionDemonstration,
} from '../../src/modules/infectious-disease/demo/necrotizing-infection-demonstration';
import { necrotizingInfectionInlinePrompt } from '../../src/modules/infectious-disease/necrotizing-infection-tutor';
import type { NecrotizingInfectionAction } from '../../src/modules/infectious-disease/necrotizing-infection';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.necrotizingInfection;
const advance = (engine: AnesthesiaEngine, tick: number, action: NecrotizingInfectionAction) => {
  engine.apply({ tick, type: 'necrotizing-infection-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 400_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = necrotizingInfectionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'necrotizing-infection-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls Before The Limb Makes The Case', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NECROTIZING_INFECTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNecrotizingInfectionDemonstration(SCENARIO)).toBe(true);
    expect(supportsNecrotizingInfectionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats.slice(0, 6)).toEqual(['recognize', 'margin', 'surgery', 'intent',
      'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('requests the review before the progression, not after it', () => {
    expect(patient.surgeryRequestedBeforeProgression).toBe(true);
    expect(narrations[beats.indexOf('surgery')]).toContain('before the limb has made the case');
  });

  it('marks the border before anything is measured against it', () => {
    expect(patient.marginMarkedAtTick).toBeLessThan(patient.surgeryAtTick!);
    expect(narrations[beats.indexOf('margin')]).toContain('turns a static impression into a rate');
  });

  it('never asserts the diagnosis, and never lets the drug replace the review', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is necrotizing fasciitis', 'the diagnosis is confirmed', 'antibiotics will settle this']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narrations[beats.indexOf('intent')]).toContain('does not replace the exploration');
    expect(narration).toContain('Nothing was diagnosed here');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.scoreExclusionAttempted).toBe(false);
    expect(patient.imagingDelayAttempted).toBe(false);
    expect(patient.crepitusExclusionAttempted).toBe(false);
    expect(patient.oralContinuationAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Answers With Sensitivities', () => {
  it('opens on the pain that runs past the edge', () => {
    const engine = create(); engine.step();
    const prompt = necrotizingInfectionInlinePrompt('guided', { scenarioVersion: '0.1.0', necrotizingInfection: snapshot(engine) })!;
    expect(prompt.id).toBe('necrotizing-recognize');
    expect(prompt.because).toContain('a reason to look harder rather than a diagnosis');
  });

  it('gives each instrument its own number at the boundary review', () => {
    const engine = create();
    for (const action of ['recognize-disproportionate-pain', 'mark-the-margin', 'call-surgery',
      'record-antimicrobial-intent'] as const) advance(engine, 0, action);
    const prompt = necrotizingInfectionInlinePrompt('guided', { scenarioVersion: '0.1.0', necrotizingInfection: snapshot(engine) })!;
    expect(prompt.id).toBe('necrotizing-boundaries');
    expect(prompt.because).toContain('two-thirds sensitive');
    expect(prompt.because).toContain('must not delay exploration');
  });

  it('never offers imaging, a score, or an absent sign as a way out', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = necrotizingInfectionInlinePrompt('guided', { scenarioVersion: '0.1.0', necrotizingInfection: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['wait for the imaging', 'the score excludes', 'no crepitus, so']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(necrotizingInfectionInlinePrompt('unassisted', { scenarioVersion: '0.1.0', necrotizingInfection: patient })).toBeNull();
    expect(necrotizingInfectionInlinePrompt('guided', { scenarioVersion: '0.1.1', necrotizingInfection: patient })).toBeNull();
  });
});
