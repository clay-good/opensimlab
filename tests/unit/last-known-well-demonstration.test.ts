/**
 * The worked example and observed-state tutor for a time nobody can supply.
 *
 * A demonstration wants to arrive somewhere, and here the only way to arrive is
 * to invent the missing time. Both ways of doing it are charting errors — the
 * uncertain recollection written as an onset, or the bound written as one — and
 * the example ends with the gap still open.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { LAST_KNOWN_WELL_A_TIME_NOBODY_CAN_SUPPLY as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/last-known-well-a-time-nobody-can-supply';
import { LAST_KNOWN_WELL_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/last-known-well-fixtures';
import {
  LAST_KNOWN_WELL_DEMONSTRATION_VERSION, lastKnownWellDemonstrationStep, supportsLastKnownWellDemonstration,
} from '../../src/modules/medical-surgical-nursing/demo/last-known-well-demonstration';
import { lastKnownWellInlinePrompt } from '../../src/modules/medical-surgical-nursing/last-known-well-tutor';
import type { LastKnownWellAction } from '../../src/modules/medical-surgical-nursing/last-known-well';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.lastKnownWell;
const advance = (engine: AnesthesiaEngine, tick: number, action: LastKnownWellAction) => {
  engine.apply({ tick, type: 'last-known-well-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = lastKnownWellDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'last-known-well-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Never Produces The Missing Time', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(LAST_KNOWN_WELL_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsLastKnownWellDemonstration(SCENARIO)).toBe(true);
    expect(supportsLastKnownWellDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.0' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats).toEqual(['bound', 'recollection', 'activate', 'consequences', 'boundaries',
      'monitor', 'await', 'pressed', 'reassess', 'handoff']);
    expect(patient.ended).toBe('handoff');
  });

  it('leaves the onset field empty at the end', () => {
    expect(patient.onsetTimeRecorded).toBeNull();
    expect(patient.recollectionChartedAttempted).toBe(false);
    expect(patient.boundChartedAttempted).toBe(false);
    expect(narration).toContain('No onset was ever produced');
  });

  it('activates on the deficit rather than waiting for the clock', () => {
    expect(patient.pathwayActivatedAtTick).not.toBeNull();
    expect(patient.waitedForFamily).toBe(false);
    expect(narrations[beats.indexOf('activate')]).toContain('rather than on the clock');
  });

  it('holds the recollection as given when somebody presses it', () => {
    expect(patient.recollectionPressed).toBe(true);
    const pressed = narrations[beats.indexOf('pressed')]!;
    expect(pressed).toContain('does not make it certain');
    expect(pressed).toContain('as she first gave it');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.recollectionChartedAttempted).toBe(false);
    expect(patient.boundChartedAttempted).toBe(false);
    expect(patient.nothingOfferedAttempted).toBe(false);
    expect(patient.waitedForFamily).toBe(false);
  });
});

describe('Requirement: The Tutor Keeps The Three Things Apart', () => {
  it('opens on labelling the bound as a bound', () => {
    const engine = create(); engine.step();
    const prompt = lastKnownWellInlinePrompt('guided', { scenarioVersion: '0.1.1', lastKnownWell: snapshot(engine) })!;
    expect(prompt.id).toBe('last-known-well-bound');
    expect(prompt.because).toContain('a claim nobody can support');
  });

  it('never asks anyone to firm the recollection up', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = lastKnownWellInlinePrompt('guided', { scenarioVersion: '0.1.1', lastKnownWell: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['pin the time down', 'confirm the time with', 'chart the onset as', 'nothing can be offered']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds the waiting beat when coached', () => {
    const engine = create();
    for (const action of ['record-last-known-well', 'record-the-uncertain-recollection',
      'activate-the-stroke-pathway', 'record-what-the-unknown-changes', 'review-boundaries', 'monitor'] as const) {
      advance(engine, 0, action);
    }
    const patient = snapshot(engine);
    expect(lastKnownWellInlinePrompt('guided', { scenarioVersion: '0.1.1', lastKnownWell: patient })!.id)
      .toBe('last-known-well-await');
    expect(lastKnownWellInlinePrompt('coached', { scenarioVersion: '0.1.1', lastKnownWell: patient })).toBeNull();
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(lastKnownWellInlinePrompt('unassisted', { scenarioVersion: '0.1.1', lastKnownWell: patient })).toBeNull();
    expect(lastKnownWellInlinePrompt('guided', { scenarioVersion: '0.1.0', lastKnownWell: patient })).toBeNull();
  });
});
