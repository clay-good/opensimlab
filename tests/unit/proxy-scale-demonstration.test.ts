/**
 * The worked example and observed-state tutor for a number without a standard.
 *
 * The behavioural total is a real measurement of something, and the error is
 * reading it as an intensity. Neither converts it, compares it with a
 * self-reported number, or states how much pain he is in: that quantity does not
 * exist in this lesson, and supplying it is the failure being taught.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PROXY_SCALE_A_NUMBER_WITHOUT_A_STANDARD as SCENARIO } from '../../src/modules/medical-surgical-nursing/scenarios/proxy-scale-a-number-without-a-standard';
import { PROXY_SCALE_FIXTURES as FIXTURES } from '../../src/modules/medical-surgical-nursing/proxy-scale-fixtures';
import {
  PROXY_SCALE_DEMONSTRATION_VERSION, proxyScaleDemonstrationStep, supportsProxyScaleDemonstration,
} from '../../src/modules/medical-surgical-nursing/demo/proxy-scale-demonstration';
import { proxyScaleInlinePrompt } from '../../src/modules/medical-surgical-nursing/proxy-scale-tutor';
import type { ProxyScaleAction } from '../../src/modules/medical-surgical-nursing/proxy-scale';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.proxyScale;
const advance = (engine: AnesthesiaEngine, tick: number, action: ProxyScaleAction) => {
  engine.apply({ tick, type: 'proxy-scale-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = proxyScaleDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'proxy-scale-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example States No Intensity', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PROXY_SCALE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsProxyScaleDemonstration(SCENARIO)).toBe(true);
    expect(supportsProxyScaleDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats).toEqual(['self-report', 'behaviours', 'limits', 'boundaries', 'monitor',
      'await', 'proxy', 'intent', 'reassess', 'handoff']);
    expect(patient.ended).toBe('handoff');
  });

  it('attempts self-report before observing anything', () => {
    expect(patient.selfReportAttemptedAtTick).toBeLessThan(patient.behavioursRecordedAtTick!);
    expect(patient.waitedForRequest).toBe(false);
    expect(narrations[0]).toContain('reference standard');
  });

  it('never converts the total into an intensity', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['his pain is', 'a pain score of', 'moderate pain', 'severe pain']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(patient.intensityReadAttempted).toBe(false);
    expect(narrations[beats.indexOf('limits')]).toContain('does not compare with a self-reported number');
    expect(narration).toContain('No intensity was ever stated');
  });

  it('treats the daughter as a source rather than a formality', () => {
    expect(patient.familyArrived).toBe(true);
    expect(patient.proxyHistoryAtTick).not.toBeNull();
    expect(narrations[beats.indexOf('proxy')]).toContain('quiet and still rather than restless');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.intensityReadAttempted).toBe(false);
    expect(patient.vitalsTrusted).toBe(false);
    expect(patient.zeroReadAttempted).toBe(false);
    expect(patient.waitedForRequest).toBe(false);
  });
});

describe('Requirement: The Tutor Keeps The Hierarchy In Order', () => {
  it('opens on asking him, even expecting no answer', () => {
    const engine = create(); engine.step();
    const prompt = proxyScaleInlinePrompt('guided', { scenarioVersion: '0.1.0', proxyScale: snapshot(engine) })!;
    expect(prompt.id).toBe('proxy-scale-self-report');
    expect(prompt.because).toContain('assumes an answer nobody asked for');
  });

  it('qualifies the total rather than reporting it', () => {
    const engine = create();
    advance(engine, 0, 'attempt-self-report');
    advance(engine, 1, 'record-the-observed-behaviours');
    const prompt = proxyScaleInlinePrompt('guided', { scenarioVersion: '0.1.0', proxyScale: snapshot(engine) })!;
    expect(prompt.id).toBe('proxy-scale-limits');
    expect(prompt.because).toContain('no intensity standard behind it');
  });

  it('never states a pain intensity or trusts the vital signs', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = proxyScaleInlinePrompt('guided', { scenarioVersion: '0.1.0', proxyScale: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['his pain is', 'out of ten', 'the vital signs confirm', 'wait until he asks']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds the waiting beat when coached', () => {
    const engine = create();
    for (const action of ['attempt-self-report', 'record-the-observed-behaviours',
      'record-what-the-score-is-not', 'review-boundaries', 'monitor'] as const) {
      advance(engine, 0, action);
    }
    const patient = snapshot(engine);
    expect(proxyScaleInlinePrompt('guided', { scenarioVersion: '0.1.0', proxyScale: patient })!.id)
      .toBe('proxy-scale-await');
    expect(proxyScaleInlinePrompt('coached', { scenarioVersion: '0.1.0', proxyScale: patient })).toBeNull();
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(proxyScaleInlinePrompt('unassisted', { scenarioVersion: '0.1.0', proxyScale: patient })).toBeNull();
    expect(proxyScaleInlinePrompt('guided', { scenarioVersion: '0.1.1', proxyScale: patient })).toBeNull();
  });
});
