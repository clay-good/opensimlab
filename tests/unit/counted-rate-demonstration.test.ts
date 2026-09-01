/**
 * The worked example and observed-state tutor for a number nobody counted.
 *
 * The tidy ending here is a corrected chart, and both are held to refusing it.
 * The earlier entries belong to whoever wrote them and are the only evidence
 * that the trend was unreliable, so the discrepancy is recorded and left open.
 * Neither may explain the rate either: this lesson supplies no cause.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { COUNTED_RATE_A_NUMBER_NOBODY_COUNTED as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/counted-rate-a-number-nobody-counted';
import { COUNTED_RATE_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/counted-rate-fixtures';
import {
  COUNTED_RATE_DEMONSTRATION_VERSION, countedRateDemonstrationStep, supportsCountedRateDemonstration,
} from '../../src/modules/medical-surgical-nursing/demo/counted-rate-demonstration';
import { countedRateInlinePrompt } from '../../src/modules/medical-surgical-nursing/counted-rate-tutor';
import type { CountedRateAction } from '../../src/modules/medical-surgical-nursing/counted-rate';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.countedRate;
const advance = (engine: AnesthesiaEngine, tick: number, action: CountedRateAction) => {
  engine.apply({ tick, type: 'counted-rate-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = countedRateDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'counted-rate-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Leaves The Chart Alone', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(COUNTED_RATE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCountedRateDemonstration(SCENARIO)).toBe(true);
    expect(supportsCountedRateDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats).toEqual(['trend', 'count', 'discrepancy', 'escalate', 'boundaries',
      'monitor', 'await', 'reassess', 'handoff']);
    expect(patient.ended).toBe('handoff');
  });

  it('counts before it records a discrepancy or escalates', () => {
    expect(patient.countedAtTick).toBeLessThan(patient.discrepancyRecordedAtTick!);
    expect(patient.countedAtTick).toBeLessThan(patient.escalationAtTick!);
    expect(patient.countedRate).toBe(28);
  });

  it('never rewrites the earlier entries, and says why', () => {
    expect(patient.retrospectiveEditAttempted).toBe(false);
    expect(patient.chartedEntries).toEqual([18, 18, 20, 18, 18, 20]);
    const discrepancy = narrations[beats.indexOf('discrepancy')]!;
    expect(discrepancy).toContain('stay as they were written');
    expect(discrepancy).toContain('only evidence');
    expect(narration).toContain('Nothing was corrected');
  });

  it('offers no cause for the rate anywhere in the example', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['because she has', 'due to pneumonia', 'the cause is', 'she is developing']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narrations[beats.indexOf('reassess')]).toContain('No cause has been established');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.trendTrusted).toBe(false);
    expect(patient.monitorCharted).toBe(false);
    expect(patient.roundedToPrevious).toBe(false);
    expect(patient.retrospectiveEditAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Holds The Discrepancy Open', () => {
  it('opens on reading the column as a distribution', () => {
    const engine = create(); engine.step();
    const prompt = countedRateInlinePrompt('guided', { scenarioVersion: '0.1.0', countedRate: snapshot(engine) })!;
    expect(prompt.id).toBe('counted-rate-trend');
    expect(prompt.because).toContain('two distinct values');
  });

  it('asks for a count before anything is recorded about it', () => {
    const engine = create();
    advance(engine, 0, 'review-the-charted-trend');
    const prompt = countedRateInlinePrompt('guided', { scenarioVersion: '0.1.0', countedRate: snapshot(engine) })!;
    expect(prompt.id).toBe('counted-rate-count');
    expect(prompt.suggestion).toContain('full sixty seconds');
  });

  it('never asks for the record to be corrected or the rate explained', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = countedRateInlinePrompt('guided', { scenarioVersion: '0.1.0', countedRate: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['correct the earlier', 'fix the chart', 'the cause is', 'she has pneumonia']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds the waiting beat when coached', () => {
    const engine = create();
    for (const action of ['review-the-charted-trend', 'count-for-a-full-minute', 'record-the-discrepancy',
      'escalate-on-the-counted-value', 'review-boundaries', 'monitor'] as const) {
      advance(engine, 0, action);
    }
    const patient = snapshot(engine);
    expect(countedRateInlinePrompt('guided', { scenarioVersion: '0.1.0', countedRate: patient })!.id)
      .toBe('counted-rate-await');
    expect(countedRateInlinePrompt('coached', { scenarioVersion: '0.1.0', countedRate: patient })).toBeNull();
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(countedRateInlinePrompt('unassisted', { scenarioVersion: '0.1.0', countedRate: patient })).toBeNull();
    expect(countedRateInlinePrompt('guided', { scenarioVersion: '0.1.1', countedRate: patient })).toBeNull();
  });
});
