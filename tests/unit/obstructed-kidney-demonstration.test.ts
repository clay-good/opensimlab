/**
 * The worked example and observed-state tutor for an obstruction antimicrobials
 * cannot reach.
 *
 * Two of the refused shortcuts are delays dressed as diligence and two are
 * decisions belonging to somebody else. Neither the tutor nor the example picks
 * a drainage route, because the randomised evidence has not separated them, and
 * neither states an hour threshold, because no guideline does.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { OBSTRUCTED_INFECTED_KIDNEY_DECOMPRESSION as SCENARIO } from '../../src/modules/infectious-disease/scenarios/obstructed-infected-kidney-decompression';
import { OBSTRUCTED_KIDNEY_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/obstructed-kidney-fixtures';
import {
  OBSTRUCTED_KIDNEY_DEMONSTRATION_VERSION, obstructedKidneyDemonstrationStep,
  supportsObstructedKidneyDemonstration,
} from '../../src/modules/infectious-disease/demo/obstructed-kidney-demonstration';
import { obstructedKidneyInlinePrompt } from '../../src/modules/infectious-disease/obstructed-kidney-tutor';
import type { ObstructedKidneyAction } from '../../src/modules/infectious-disease/obstructed-kidney';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstructedKidney;
const advance = (engine: AnesthesiaEngine, tick: number, action: ObstructedKidneyAction) => {
  engine.apply({ tick, type: 'obstructed-kidney-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 400_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = obstructedKidneyDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'obstructed-kidney-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Chooses No Route And Names No Hour', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(OBSTRUCTED_KIDNEY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsObstructedKidneyDemonstration(SCENARIO)).toBe(true);
    expect(supportsObstructedKidneyDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats.slice(0, 7)).toEqual(['recognize', 'urology', 'cultures', 'intent',
      'defer', 'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('names neither a modality nor a deadline anywhere', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['within one hour', 'within 60 minutes', 'nephrostomy is better',
      'stent instead', 'choose a nephrostomy']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narrations[beats.indexOf('boundaries')]).toContain('No guideline states an hour threshold');
    expect(narration).toContain('no deadline was invented');
  });

  it('keeps the stone a separate decision from the drainage', () => {
    expect(patient.stoneDeferralAtTick).not.toBeNull();
    expect(patient.earlyStoneTreatmentAttempted).toBe(false);
    expect(narrations[beats.indexOf('defer')]).toContain('does not remove the stone');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.antibioticsOnlyAttempted).toBe(false);
    expect(patient.markerDelayAttempted).toBe(false);
    expect(patient.modalityChoiceAttempted).toBe(false);
    expect(patient.earlyStoneTreatmentAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Refuses The Delays Without Inventing Urgency', () => {
  it('opens on reading the two findings together', () => {
    const engine = create(); engine.step();
    const prompt = obstructedKidneyInlinePrompt('guided', { scenarioVersion: '0.1.0', obstructedKidney: snapshot(engine) })!;
    expect(prompt.id).toBe('obstructed-kidney-recognize');
    expect(prompt.because).toContain('one thing rather than two');
  });

  it('never picks a modality or states a threshold', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = obstructedKidneyInlinePrompt('guided', { scenarioVersion: '0.1.0', obstructedKidney: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['within one hour', 'nephrostomy is better', 'wait for the crp', 'antibiotics alone will']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(obstructedKidneyInlinePrompt('unassisted', { scenarioVersion: '0.1.0', obstructedKidney: patient })).toBeNull();
    expect(obstructedKidneyInlinePrompt('guided', { scenarioVersion: '0.1.1', obstructedKidney: patient })).toBeNull();
  });
});
