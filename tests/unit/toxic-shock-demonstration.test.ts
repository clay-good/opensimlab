/**
 * The worked example and observed-state tutor for a definition that cannot
 * close.
 *
 * Neither surveillance definition can be met inside this rehearsal, by
 * construction: one waits on desquamation a week or two away, the other on an
 * organism from a sterile site. The example ends with both still open, which is
 * the hardest thing for the form to do — resolving would mean either declaring a
 * case that cannot be declared, or reading an unmet definition as an answer.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { TOXIC_SHOCK_A_DEFINITION_THAT_CANNOT_CLOSE as SCENARIO } from '../../src/modules/infectious-disease/scenarios/toxic-shock-a-definition-that-cannot-close';
import { TOXIC_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/toxic-shock-fixtures';
import {
  TOXIC_SHOCK_DEMONSTRATION_VERSION, toxicShockDemonstrationStep, supportsToxicShockDemonstration,
} from '../../src/modules/infectious-disease/demo/toxic-shock-demonstration';
import { toxicShockInlinePrompt } from '../../src/modules/infectious-disease/toxic-shock-tutor';
import type { ToxicShockAction } from '../../src/modules/infectious-disease/toxic-shock';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.toxicShock;
const advance = (engine: AnesthesiaEngine, tick: number, action: ToxicShockAction) => {
  engine.apply({ tick, type: 'toxic-shock-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 400_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = toxicShockDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'toxic-shock-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Ends With Both Definitions Open', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(TOXIC_SHOCK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsToxicShockDemonstration(SCENARIO)).toBe(true);
    expect(supportsToxicShockDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats.slice(0, 7)).toEqual(['recognize', 'critical-care', 'cultures', 'intent',
      'definition', 'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('leaves both definitions unmet and declares nothing', () => {
    expect(patient.staphylococcalDefinitionMet).toBe(false);
    expect(patient.streptococcalDefinitionMet).toBe(false);
    expect(patient.confirmationAttempted).toBe(false);
    expect(narration).toContain('Both definitions are still open');
    expect(narration).toContain('Nothing was declared and nothing was excluded');
  });

  it('records why each definition is unmet rather than only that it is', () => {
    const definition = narrations[beats.indexOf('definition')]!;
    expect(definition).toContain('desquamation');
    expect(definition).toContain('organism from a sterile site');
  });

  it('treats before either definition could answer', () => {
    expect(patient.treatmentIntentAtTick).toBeLessThan(patient.definitionStatusAtTick!);
    expect(narrations[beats.indexOf('critical-care')]).toContain('not coming today');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.confirmationAttempted).toBe(false);
    expect(patient.criteriaExclusionAttempted).toBe(false);
    expect(patient.pendingCultureExclusionAttempted).toBe(false);
    expect(patient.negativeCultureMisreadAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Keeps The Definition Open', () => {
  it('opens on the pattern rather than the case', () => {
    const engine = create(); engine.step();
    const prompt = toxicShockInlinePrompt('guided', { scenarioVersion: '0.1.0', toxicShock: snapshot(engine) })!;
    expect(prompt.id).toBe('toxic-shock-recognize');
    expect(prompt.because).toContain('not the same as naming a case');
  });

  it('names what a surveillance definition is for', () => {
    const engine = create();
    for (const action of ['recognize-toxin-pattern', 'activate-critical-care', 'request-cultures',
      'record-treatment-intent', 'record-definition-status'] as const) advance(engine, 0, action);
    const prompt = toxicShockInlinePrompt('guided', { scenarioVersion: '0.1.0', toxicShock: snapshot(engine) })!;
    expect(prompt.id).toBe('toxic-shock-boundaries');
    expect(prompt.because).toContain('count cases consistently across populations');
    expect(prompt.because).toContain('excludes other diagnoses rather than infection');
  });

  it('never declares the case and never excludes it', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = toxicShockInlinePrompt('guided', { scenarioVersion: '0.1.0', toxicShock: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is toxic shock syndrome', 'the cultures are negative, so', 'the criteria are not met, so']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(toxicShockInlinePrompt('unassisted', { scenarioVersion: '0.1.0', toxicShock: patient })).toBeNull();
    expect(toxicShockInlinePrompt('guided', { scenarioVersion: '0.1.1', toxicShock: patient })).toBeNull();
  });
});
