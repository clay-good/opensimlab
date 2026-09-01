/**
 * The worked example and observed-state tutor for two problems on different
 * clocks.
 *
 * The infection is responding and the valve is failing, and every refused
 * shortcut reads a fact about the first as reassurance about the second. The
 * example refers before the patient decompensates, which is where the decision
 * is actually hard: at that moment everything on the chart is improving, and the
 * improvement is real.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ENDOCARDITIS_MECHANICAL_FAILURE_ON_A_SURGICAL_CLOCK as SCENARIO } from '../../src/modules/infectious-disease/scenarios/endocarditis-mechanical-failure-on-a-surgical-clock';
import { ENDOCARDITIS_HEART_FAILURE_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/endocarditis-heart-failure-fixtures';
import {
  ENDOCARDITIS_HEART_FAILURE_DEMONSTRATION_VERSION, endocarditisHeartFailureDemonstrationStep,
  supportsEndocarditisHeartFailureDemonstration,
} from '../../src/modules/infectious-disease/demo/endocarditis-heart-failure-demonstration';
import { endocarditisHeartFailureInlinePrompt } from '../../src/modules/infectious-disease/endocarditis-heart-failure-tutor';
import type { EndocarditisHeartFailureAction } from '../../src/modules/infectious-disease/endocarditis-heart-failure';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.endocarditisHeartFailure;
const advance = (engine: AnesthesiaEngine, tick: number, action: EndocarditisHeartFailureAction) => {
  engine.apply({ tick, type: 'endocarditis-heart-failure-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 400_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = endocarditisHeartFailureDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'endocarditis-heart-failure-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refers While The Chart Improves', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ENDOCARDITIS_HEART_FAILURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsEndocarditisHeartFailureDemonstration(SCENARIO)).toBe(true);
    expect(supportsEndocarditisHeartFailureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats.slice(0, 5)).toEqual(['recognize', 'team', 'referral', 'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('refers before the decompensation rather than after it', () => {
    expect(patient.referralBeforeDecompensation).toBe(true);
    expect(narrations[beats.indexOf('referral')]).toContain('while the chart still looks better');
  });

  it('selects no operation, prosthesis, or theatre time', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['valve replacement tomorrow', 'a mechanical prosthesis', 'book theatre for']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narrations[beats.indexOf('referral')]).toContain('Nothing here selects an operation');
    expect(narration).toContain('No operation and no time were chosen');
  });

  it('keeps the responding infection true rather than explaining it away', () => {
    expect(narrations[0]).toContain('the antimicrobials really are working');
    expect(narration).toContain('an infection that is responding');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.markerReassuranceAttempted).toBe(false);
    expect(patient.pulsePressureErrorAttempted).toBe(false);
    expect(patient.vegetationOnlyAttempted).toBe(false);
    expect(patient.deferralAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Says Which Problem A Number Belongs To', () => {
  it('opens by separating the valve from the treatment', () => {
    const engine = create(); engine.step();
    const prompt = endocarditisHeartFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', endocarditisHeartFailure: snapshot(engine) })!;
    expect(prompt.id).toBe('endocarditis-recognize');
    expect(prompt.because).toContain('separate fact about a separate problem');
  });

  it('corrects the pulse pressure with the mechanism', () => {
    const engine = create();
    for (const action of ['recognize-mechanical-failure', 'call-endocarditis-team',
      'record-surgical-referral-intent'] as const) advance(engine, 0, action);
    const prompt = endocarditisHeartFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', endocarditisHeartFailure: snapshot(engine) })!;
    expect(prompt.id).toBe('endocarditis-boundaries');
    expect(prompt.because).toContain('no time to dilate');
    expect(prompt.because).toContain('not on its own');
  });

  it('never offers the markers or a deferral as reassurance', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = endocarditisHeartFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', endocarditisHeartFailure: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['review tomorrow', 'the markers are reassuring', 'he is improving overall']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(endocarditisHeartFailureInlinePrompt('unassisted', { scenarioVersion: '0.1.0', endocarditisHeartFailure: patient })).toBeNull();
    expect(endocarditisHeartFailureInlinePrompt('guided', { scenarioVersion: '0.1.1', endocarditisHeartFailure: patient })).toBeNull();
  });
});
