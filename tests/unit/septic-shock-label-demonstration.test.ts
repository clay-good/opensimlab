/**
 * The worked example and observed-state tutor for a label the treatment creates.
 *
 * The definition needs vasopressors running and a lactate above threshold
 * despite adequate resuscitation, so the classification is downstream of the
 * treatment rather than upstream of it. Neither the tutor nor the example
 * applies it early, and neither withholds care while waiting for it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SEPTIC_SHOCK_A_LABEL_THE_TREATMENT_CREATES as SCENARIO } from '../../src/modules/infectious-disease/scenarios/septic-shock-a-label-the-treatment-creates';
import { SEPTIC_SHOCK_LABEL_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/septic-shock-label-fixtures';
import {
  SEPTIC_SHOCK_LABEL_DEMONSTRATION_VERSION, septicShockLabelDemonstrationStep,
  supportsSepticShockLabelDemonstration,
} from '../../src/modules/infectious-disease/demo/septic-shock-label-demonstration';
import { septicShockLabelInlinePrompt } from '../../src/modules/infectious-disease/septic-shock-label-tutor';
import type { SepticShockLabelAction } from '../../src/modules/infectious-disease/septic-shock-label';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.septicShockLabel;
const advance = (engine: AnesthesiaEngine, tick: number, action: SepticShockLabelAction) => {
  engine.apply({ tick, type: 'septic-shock-label-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 400_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = septicShockLabelDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'septic-shock-label-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads The Label Off The Trial', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SEPTIC_SHOCK_LABEL_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSepticShockLabelDemonstration(SCENARIO)).toBe(true);
    expect(supportsSepticShockLabelDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.0' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats.slice(0, 6)).toEqual(['hypoperfusion', 'critical-care', 'classification',
      'intent', 'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('activates critical care before the classification is even open', () => {
    expect(patient.criticalCareAtTick).toBeLessThan(patient.classificationOpenAtTick!);
    expect(narrations[beats.indexOf('critical-care')]).toContain('waits for the classification');
  });

  it('records the intent inside the ceiling', () => {
    expect(patient.resuscitationIntentInsideCeiling).toBe(true);
    expect(patient.ceilingPassed).toBe(false);
  });

  it('never applies the label before the trial completes', () => {
    const beforeTrial = narrations.slice(0, beats.indexOf('observe') + 1).join(' ').toLowerCase();
    for (const forbidden of ['this is septic shock', 'septic shock confirmed', 'he is in septic shock']) {
      expect(beforeTrial, forbidden).not.toContain(forbidden);
    }
    expect(patient.earlyLabelAttempted).toBe(false);
    expect(narration).toContain('never available at the start');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.earlyLabelAttempted).toBe(false);
    expect(patient.hypoxiaAttempted).toBe(false);
    expect(patient.normalizationAttempted).toBe(false);
    expect(patient.mapTargetAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Attaches The Grades', () => {
  it('opens on a description rather than a classification', () => {
    const engine = create(); engine.step();
    const prompt = septicShockLabelInlinePrompt('guided', { scenarioVersion: '0.1.1', septicShockLabel: snapshot(engine) })!;
    expect(prompt.id).toBe('septic-shock-hypoperfusion');
    expect(prompt.because).toContain('a description rather than a classification');
  });

  it('corrects the lactate and the pressure target with their grades', () => {
    const engine = create();
    for (const action of ['record-hypoperfusion', 'activate-critical-care',
      'record-classification-open', 'record-resuscitation-intent'] as const) advance(engine, 0, action);
    const prompt = septicShockLabelInlinePrompt('guided', { scenarioVersion: '0.1.1', septicShockLabel: snapshot(engine) })!;
    expect(prompt.id).toBe('septic-shock-boundaries');
    expect(prompt.because).toContain('comparative rather than a floor');
    expect(prompt.because).toContain('not a measure of tissue hypoxia');
  });

  it('never declares the label or chases the lactate to normal', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = septicShockLabelInlinePrompt('guided', { scenarioVersion: '0.1.1', septicShockLabel: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is septic shock', 'until the lactate normalizes', 'raise the target above 65']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(septicShockLabelInlinePrompt('unassisted', { scenarioVersion: '0.1.1', septicShockLabel: patient })).toBeNull();
    expect(septicShockLabelInlinePrompt('guided', { scenarioVersion: '0.1.0', septicShockLabel: patient })).toBeNull();
  });
});
