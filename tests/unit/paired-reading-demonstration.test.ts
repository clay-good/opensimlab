/**
 * The worked example and observed-state tutor for an error that runs one way.
 *
 * Every instinct at this bedside is a perfusion instinct, and the discrepancy is
 * optical, so none of them corrects it. The demonstration form makes that a real
 * hazard: the obvious way to fill the wait for the arterial result is to do
 * something to the probe. This example does not, and neither prompt nor
 * narration calls the device faulty or names what is wrong with the patient.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PAIRED_READING_A_NUMBER_WRONG_IN_ONE_DIRECTION as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/paired-reading-a-number-wrong-in-one-direction';
import { PAIRED_READING_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/paired-reading-fixtures';
import {
  PAIRED_READING_DEMONSTRATION_VERSION, pairedReadingDemonstrationStep, supportsPairedReadingDemonstration,
} from '../../src/modules/medical-surgical-nursing/demo/paired-reading-demonstration';
import { pairedReadingInlinePrompt } from '../../src/modules/medical-surgical-nursing/paired-reading-tutor';
import type { PairedReadingAction } from '../../src/modules/medical-surgical-nursing/paired-reading';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pairedReading;
const advance = (engine: AnesthesiaEngine, tick: number, action: PairedReadingAction) => {
  engine.apply({ tick, type: 'paired-reading-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pairedReadingDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'paired-reading-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Never Touches The Probe', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PAIRED_READING_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPairedReadingDemonstration(SCENARIO)).toBe(true);
    expect(supportsPairedReadingDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats).toEqual(['oximeter', 'boundaries', 'monitor', 'await', 'pair', 'gap',
      'escalate', 'reassess', 'handoff']);
    expect(patient.ended).toBe('handoff');
  });

  it('waits for the arterial result instead of adjusting the device', () => {
    expect(patient.repositionAttempted).toBe(false);
    expect(patient.warmingAttempted).toBe(false);
    expect(patient.trendTrusted).toBe(false);
    expect(patient.standardAssumedFixed).toBe(false);
    expect(narrations[beats.indexOf('await')]).toContain('rather than filling the time at the probe');
  });

  it('pairs both values before escalating, and escalates on the arterial one', () => {
    expect(patient.pairedAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(patient.oximeterPercent).toBe(94);
    expect(patient.arterialPercent).toBe(86);
    expect(narrations[beats.indexOf('escalate')]).toContain('arterial value of 86 percent');
  });

  it('calls the device neither faulty nor the patient diagnosed', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['broken', 'faulty device', 'the diagnosis is', 'she has pneumonia']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narrations[beats.indexOf('reassess')]).toContain('No device fault has been demonstrated');
  });
});

describe('Requirement: The Tutor Refuses The Perfusion Instinct', () => {
  it('opens on recording the reading as an oximeter reading', () => {
    const engine = create(); engine.step();
    const prompt = pairedReadingInlinePrompt('guided', { scenarioVersion: '0.1.0', pairedReading: snapshot(engine) })!;
    expect(prompt.id).toBe('paired-reading-oximeter');
    expect(prompt.because).toContain('not the same claim');
  });

  it('names the optical cause rather than a bedside remedy', () => {
    const engine = create();
    advance(engine, 0, 'record-the-oximeter-reading');
    const prompt = pairedReadingInlinePrompt('guided', { scenarioVersion: '0.1.0', pairedReading: snapshot(engine) })!;
    expect(prompt.id).toBe('paired-reading-boundaries');
    expect(prompt.because).toContain('optical rather than a perfusion artifact');
    expect(prompt.suggestion).not.toContain('probe');
  });

  it('never suggests repositioning, warming, or trusting the trend', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pairedReadingInlinePrompt('guided', { scenarioVersion: '0.1.0', pairedReading: snapshot(engine) });
      if (prompt) seen.push(prompt.suggestion.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['reposition', 'warm the hand', 'another finger', 'trust the oximeter']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds the two waiting beats when coached', () => {
    const engine = create();
    for (const action of ['record-the-oximeter-reading', 'review-boundaries', 'monitor'] as const) {
      advance(engine, 0, action);
    }
    const patient = snapshot(engine);
    expect(pairedReadingInlinePrompt('guided', { scenarioVersion: '0.1.0', pairedReading: patient })!.id)
      .toBe('paired-reading-await');
    expect(pairedReadingInlinePrompt('coached', { scenarioVersion: '0.1.0', pairedReading: patient })).toBeNull();
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pairedReadingInlinePrompt('unassisted', { scenarioVersion: '0.1.0', pairedReading: patient })).toBeNull();
    expect(pairedReadingInlinePrompt('guided', { scenarioVersion: '0.1.1', pairedReading: patient })).toBeNull();
  });
});
