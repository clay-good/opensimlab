/**
 * The worked example and observed-state tutor for a score compared with the
 * wrong range.
 *
 * The harm here arrives as a helpful offer: a colleague reads the old score and
 * suggests putting some oxygen on her. Neither the tutor nor the example ever
 * touches the oxygen, and both answer that offer with the prescribed range
 * rather than with a number.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { OXYGEN_TARGET_SCALE_A_SCORE_THAT_SHOULD_BE_LOWER as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/oxygen-target-scale-a-score-that-should-be-lower';
import { OXYGEN_TARGET_SCALE_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/oxygen-target-scale-fixtures';
import {
  OXYGEN_TARGET_SCALE_DEMONSTRATION_VERSION, oxygenTargetScaleDemonstrationStep,
  supportsOxygenTargetScaleDemonstration,
} from '../../src/modules/medical-surgical-nursing/demo/oxygen-target-scale-demonstration';
import { oxygenTargetScaleInlinePrompt } from '../../src/modules/medical-surgical-nursing/oxygen-target-scale-tutor';
import type { OxygenTargetScaleAction } from '../../src/modules/medical-surgical-nursing/oxygen-target-scale';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.oxygenTargetScale;
const advance = (engine: AnesthesiaEngine, tick: number, action: OxygenTargetScaleAction) => {
  engine.apply({ tick, type: 'oxygen-target-scale-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = oxygenTargetScaleDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'oxygen-target-scale-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Never Reaches For The Oxygen', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(OXYGEN_TARGET_SCALE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsOxygenTargetScaleDemonstration(SCENARIO)).toBe(true);
    expect(supportsOxygenTargetScaleDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats.slice(0, 8)).toEqual(['prescription', 'chart', 'mismatch', 'rescore',
      'consequences', 'confirm', 'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('reads the prescription before the chart, and records the mismatch before rescoring', () => {
    expect(patient.prescriptionCheckedAtTick).toBeLessThan(patient.chartCheckedAtTick!);
    expect(patient.mismatchRecordedAtTick).toBeLessThan(patient.rescoredAtTick!);
  });

  it('names no flow and takes none of the four refused shortcuts', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['litres', 'l/min', 'turn the oxygen up', 'increase the oxygen to']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(patient.oxygenRaiseAttempted).toBe(false);
    expect(patient.scaleAssumedFromDiagnosis).toBe(false);
    expect(patient.lowerScoreReadAsWell).toBe(false);
    expect(patient.higherOfBothScoresTaken).toBe(false);
    expect(narration).toContain('No oxygen was selected, set, or delivered');
  });

  it('answers the colleague with the range rather than the number', () => {
    if (!beats.includes('colleague')) return;
    const colleague = narrations[beats.indexOf('colleague')]!;
    expect(colleague).toContain('arrives as help rather than as a mistake');
    expect(colleague).toContain(patient.prescribedTargetRange);
  });

  it('refuses the corrected score as evidence of improvement', () => {
    expect(narrations[beats.indexOf('consequences')]).toContain('The score changed; she did not');
    expect(narrations[beats.indexOf('consequences')]).toContain('not a statement that she is well');
  });
});

describe('Requirement: The Tutor Answers With The Range', () => {
  it('opens on the prescription', () => {
    const engine = create(); engine.step();
    const prompt = oxygenTargetScaleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxygenTargetScale: snapshot(engine) })!;
    expect(prompt.id).toBe('oxygen-target-prescription');
    expect(prompt.because).toContain('which range she is being compared with');
  });

  it('never suggests oxygen, a diagnosis-chosen scale, or the higher of both scores', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = oxygenTargetScaleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxygenTargetScale: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['raise the oxygen', 'litres', 'take the higher', 'she is improving']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds the waiting beat when coached', () => {
    const engine = create();
    for (const action of ['check-the-prescription', 'check-the-chart', 'record-the-scale-mismatch',
      'rescore-on-the-prescribed-scale', 'record-what-the-rescore-changes',
      'confirm-the-scale-with-the-team', 'review-boundaries', 'monitor'] as const) {
      advance(engine, 0, action);
    }
    const patient = snapshot(engine);
    expect(oxygenTargetScaleInlinePrompt('guided', { scenarioVersion: '0.1.0', oxygenTargetScale: patient })!.id)
      .toBe('oxygen-target-await');
    expect(oxygenTargetScaleInlinePrompt('coached', { scenarioVersion: '0.1.0', oxygenTargetScale: patient })).toBeNull();
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(oxygenTargetScaleInlinePrompt('unassisted', { scenarioVersion: '0.1.0', oxygenTargetScale: patient })).toBeNull();
    expect(oxygenTargetScaleInlinePrompt('guided', { scenarioVersion: '0.1.1', oxygenTargetScale: patient })).toBeNull();
  });
});
