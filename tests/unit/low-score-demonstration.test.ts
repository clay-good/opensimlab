/**
 * The worked example and observed-state tutor for a score that is right.
 *
 * The run ends with a positive culture, so a demonstration is exposed here in a
 * particular way: arriving there can read as though the nurse knew. The example
 * is held to making the call while the score is still 2 and nothing has been
 * confirmed, and neither it nor the tutor may hint at the organism before the
 * review has happened.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/low-score-what-the-threshold-does-not-exclude';
import { LOW_SCORE_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/low-score-fixtures';
import {
  LOW_SCORE_DEMONSTRATION_VERSION, lowScoreDemonstrationStep, supportsLowScoreDemonstration,
} from '../../src/modules/medical-surgical-nursing/demo/low-score-demonstration';
import { lowScoreInlinePrompt } from '../../src/modules/medical-surgical-nursing/low-score-tutor';
import type { LowScoreAction } from '../../src/modules/medical-surgical-nursing/low-score';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.lowScore;
const advance = (engine: AnesthesiaEngine, tick: number, action: LowScoreAction) => {
  engine.apply({ tick, type: 'low-score-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = lowScoreDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'low-score-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls Before It Knows', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(LOW_SCORE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsLowScoreDemonstration(SCENARIO)).toBe(true);
    expect(supportsLowScoreDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats).toEqual(['observations', 'exclusions', 'listen', 'family', 'escalate',
      'boundaries', 'monitor', 'await', 'reassess', 'handoff']);
    expect(patient.ended).toBe('handoff');
  });

  it('escalates while the score is still below its threshold and nothing is confirmed', () => {
    expect(patient.belowEscalationThreshold).toBe(true);
    expect(patient.aggregateScore).toBe(2);
    expect(patient.escalationAtTick).toBeLessThan(patient.monitoringAtTick!);
    const escalate = narrations[beats.indexOf('escalate')]!;
    expect(escalate).toContain('nothing confirmed');
  });

  it('names the organism only after the review, never before the call', () => {
    // The cohort statistic may be cited before the call, because it is about a
    // population. Nothing about this patient's result may be.
    const beforeCall = narrations.slice(0, beats.indexOf('escalate') + 1).join(' ').toLowerCase();
    for (const forbidden of ['gram-negative', 'her culture', 'the cultures', 'she is septic', 'she has sepsis', 'she is infected']) {
      expect(beforeCall, forbidden).not.toContain(forbidden);
    }
    expect(narrations[beats.indexOf('reassess')]).toContain('gram-negative');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.recheckAttempted).toBe(false);
    expect(patient.feverExclusionAttempted).toBe(false);
    expect(patient.qsofaAttempted).toBe(false);
    expect(patient.documentationOnlyAttempted).toBe(false);
  });

  it('records the score as correct rather than treating it as the error', () => {
    expect(narrations[0]).toContain('it is 2 correctly');
    expect(narrations[beats.indexOf('reassess')]).toContain('never the thing that was wrong');
  });
});

describe('Requirement: The Tutor Bounds The Instrument, Not The Diagnosis', () => {
  it('opens on recording the true number', () => {
    const engine = create(); engine.step();
    const prompt = lowScoreInlinePrompt('guided', { scenarioVersion: '0.1.0', lowScore: snapshot(engine) })!;
    expect(prompt.id).toBe('low-score-observations');
    expect(prompt.because).toContain('it is 2 correctly');
  });

  it('asks for the family report in its own words rather than as a number', () => {
    const engine = create();
    advance(engine, 0, 'record-observations-and-score');
    advance(engine, 1, 'record-what-the-score-excludes');
    for (let tick = 2; tick <= 12_100; tick += 1) engine.step();
    const prompt = lowScoreInlinePrompt('guided', { scenarioVersion: '0.1.0', lowScore: snapshot(engine) })!;
    expect(prompt.id).toBe('low-score-family');
    expect(prompt.because).toContain('invent the observation');
  });

  it('never diagnoses, and never says the score is wrong', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      for (let at = engine.equipment() ? 0 : 0; at < 1; at += 1) {
        const prompt = lowScoreInlinePrompt('guided', { scenarioVersion: '0.1.0', lowScore: snapshot(engine) });
        if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      }
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['she has sepsis', 'the score is wrong', 'miscalculated', 'start antibiotics']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds the two waiting beats when coached', () => {
    const engine = create();
    advance(engine, 0, 'record-observations-and-score');
    advance(engine, 1, 'record-what-the-score-excludes');
    const patient = snapshot(engine);
    expect(lowScoreInlinePrompt('guided', { scenarioVersion: '0.1.0', lowScore: patient })!.id)
      .toBe('low-score-listen');
    expect(lowScoreInlinePrompt('coached', { scenarioVersion: '0.1.0', lowScore: patient })).toBeNull();
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(lowScoreInlinePrompt('unassisted', { scenarioVersion: '0.1.0', lowScore: patient })).toBeNull();
    expect(lowScoreInlinePrompt('guided', { scenarioVersion: '0.1.1', lowScore: patient })).toBeNull();
  });
});
