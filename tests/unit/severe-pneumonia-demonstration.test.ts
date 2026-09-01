/**
 * The worked example and observed-state tutor for two instruments that both read
 * correctly.
 *
 * The mortality score is not wrong. It is answering thirty-day mortality, and
 * the lower band it produces is the right answer to a question nobody asked
 * here. Neither the tutor nor the example calls it an error, and both refuse the
 * two readings that look like measurement: a marker in no criteria set, and a
 * saturation quoted without its inspired fraction.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SEVERE_PNEUMONIA_THE_SCORE_ANSWERED_ANOTHER_QUESTION as SCENARIO } from '../../src/modules/infectious-disease/scenarios/severe-pneumonia-the-score-answered-another-question';
import { SEVERE_PNEUMONIA_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/severe-pneumonia-fixtures';
import {
  SEVERE_PNEUMONIA_DEMONSTRATION_VERSION, severePneumoniaDemonstrationStep,
  supportsSeverePneumoniaDemonstration,
} from '../../src/modules/infectious-disease/demo/severe-pneumonia-demonstration';
import { severePneumoniaInlinePrompt } from '../../src/modules/infectious-disease/severe-pneumonia-tutor';
import type { SeverePneumoniaAction } from '../../src/modules/infectious-disease/severe-pneumonia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.severePneumonia;
const advance = (engine: AnesthesiaEngine, tick: number, action: SeverePneumoniaAction) => {
  engine.apply({ tick, type: 'severe-pneumonia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 400_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = severePneumoniaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'severe-pneumonia-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls While He Is Still On The Ward', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SEVERE_PNEUMONIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSeverePneumoniaDemonstration(SCENARIO)).toBe(true);
    expect(supportsSeverePneumoniaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats.slice(0, 6)).toEqual(['reconcile', 'mismatch', 'critical-care', 'intent',
      'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('requests review before the deterioration', () => {
    expect(patient.criticalCareBeforeDeterioration).toBe(true);
    expect(patient.waitAttempted).toBe(false);
    expect(narrations[beats.indexOf('critical-care')]).toContain('still talking to you');
  });

  it('never calls the prognostic score an error', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the score is wrong', 'miscalculated', 'ignore the score']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narrations[beats.indexOf('mismatch')]).toContain('not an error');
    expect(narration).toContain('was never wrong');
  });

  it('selects no device, setting, or bed', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['high-flow at 50', 'peep of', 'book an intensive care bed']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narrations[beats.indexOf('intent')]).toContain('No oxygen device, ventilator setting, or bed is selected');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.mortalityScoreAttempted).toBe(false);
    expect(patient.waitAttempted).toBe(false);
    expect(patient.markerSeverityAttempted).toBe(false);
    expect(patient.saturationAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Names The Question Each Instrument Answers', () => {
  it('opens on putting both scores side by side', () => {
    const engine = create(); engine.step();
    const prompt = severePneumoniaInlinePrompt('guided', { scenarioVersion: '0.1.0', severePneumonia: snapshot(engine) })!;
    expect(prompt.id).toBe('severe-pneumonia-reconcile');
    expect(prompt.because).toContain('both are calculated correctly');
  });

  it('refuses the saturation without its fraction', () => {
    const engine = create();
    for (const action of ['reconcile-supplied-scores', 'recognize-instrument-mismatch',
      'call-critical-care', 'record-escalation-intent', 'review-boundaries'] as const) {
      advance(engine, 0, action);
    }
    const prompt = severePneumoniaInlinePrompt('guided', { scenarioVersion: '0.1.0', severePneumonia: snapshot(engine) })!;
    expect(prompt.id).toBe('severe-pneumonia-monitor');
    expect(prompt.because).toContain('very different lungs');
  });

  it('never grades severity by a marker or waits for deterioration', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = severePneumoniaInlinePrompt('guided', { scenarioVersion: '0.1.0', severePneumonia: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['wait until he deteriorates', 'the crp shows severe', 'the score says ward']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(severePneumoniaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', severePneumonia: patient })).toBeNull();
    expect(severePneumoniaInlinePrompt('guided', { scenarioVersion: '0.1.1', severePneumonia: patient })).toBeNull();
  });
});
