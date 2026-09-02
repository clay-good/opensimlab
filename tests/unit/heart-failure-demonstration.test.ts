/**
 * The worked example and observed-state tutor for a man who feels better.
 *
 * The lesson is that feeling better is the first thing to improve and the
 * least reliable thing to discharge on.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_DECOMPENSATED_HEART_FAILURE as SCENARIO } from '../../src/modules/cardiology/scenarios/acute-decompensated-heart-failure';
import { HEART_FAILURE_FIXTURES as FIXTURES } from '../../src/modules/cardiology/heart-failure-fixtures';
import {
  HEART_FAILURE_DEMONSTRATION_VERSION, heartFailureDemonstrationStep,
  supportsHeartFailureDemonstration,
} from '../../src/modules/cardiology/demo/heart-failure-demonstration';
import { heartFailureInlinePrompt } from '../../src/modules/cardiology/tutor/heart-failure-guidance';
import type { HeartFailureAction } from '../../src/modules/cardiology/heart-failure';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.heartFailureAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: HeartFailureAction) => {
  engine.apply({ tick, type: 'heart-failure-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = heartFailureDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'heart-failure-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Discharge On A Symptom', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(HEART_FAILURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHeartFailureDemonstration(SCENARIO)).toBe(true);
    expect(supportsHeartFailureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsHeartFailureDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches the readiness reassessment through all five steps in order', () => {
    expect(beats).toEqual(['status', 'response', 'tolerance', 'transition', 'readiness']);
    expect(patient.statusAtTick).toBeLessThan(patient.responseAtTick!);
    expect(patient.responseAtTick).toBeLessThan(patient.toleranceAtTick!);
    expect(patient.toleranceAtTick).toBeLessThan(patient.transitionAtTick!);
    expect(patient.transitionAtTick).toBeLessThan(patient.readinessAtTick!);
  });

  it('asks wet and cold separately and names the misread combination', () => {
    const status = narrations[beats.indexOf('status')]!;
    expect(status).toContain('Is he wet, and is he cold?');
    expect(status).toContain('invites the conclusion that the congestion has been dealt with');
  });

  it('lays the five findings side by side and names the unreliable one', () => {
    const response = narrations[beats.indexOf('response')]!;
    expect(response).toContain('still 3.8 kg above his own baseline');
    expect(response).toContain('the one that says better is the one he can tell you about');
  });

  it('reads the creatinine rise carefully rather than reactively', () => {
    const tolerance = narrations[beats.indexOf('tolerance')]!;
    expect(tolerance).toContain('is not automatically kidney injury');
    expect(tolerance).toContain('a well-worn way to send a patient home to bounce back');
    expect(tolerance).toContain('both of those have causes');
  });

  it('keeps the two jobs separate', () => {
    const transition = narrations[beats.indexOf('transition')]!;
    expect(transition).toContain('changes what happens to him over years rather than over this admission');
    expect(transition).toContain('Recording the intent is not writing the regimen');
    expect(patient.doseCalculated).toBe(false);
  });

  it('says plainly that he is not ready and makes the later discharge safe', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('the single best predictor of coming straight back');
    expect(readiness).toContain('early follow-up rather than a routine appointment in six weeks');
    expect(patient.dischargeReady).toBe(false);
    expect(patient.residualCongestion).toBe(true);
    expect(narration).toContain('three and a half kilos above his own baseline, and staying');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('never names a dry weight, a dose, a regimen, or a discharge', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['his dry weight is', 'give 80 mg', 'double the furosemide', 'start sacubitril', 'he can go home', 'discharge him today']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(patient.treatmentDelivered).toBe(false);
  });
});

describe('Requirement: The Tutor Enforces The Order Of Judgement', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = heartFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['hf-status', 'hf-response', 'hf-tolerance', 'hf-transition', 'hf-readiness']);
  });

  it('stays on the response when a transition is attempted first', () => {
    const engine = create();
    advance(engine, 0, 'reconcile-heart-failure-congestion-and-perfusion');
    advance(engine, 1, 'record-heart-failure-transition-intent');
    expect(snapshot(engine)!.transitionAtTick).toBeNull();
    expect(snapshot(engine)!.responseAtTick).toBeNull();
    const prompt = heartFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hf-response');
    expect(prompt.suggestion).toContain('notice which one is lying to you');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-heart-failure-diuretic-response');
    expect(snapshot(engine)!.statusAtTick).toBeNull();
    expect(snapshot(engine)!.responseAtTick).toBeNull();
    expect(heartFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('hf-status');
  });

  it('never names a dose, a regimen, or a discharge', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = heartFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give 80 mg', 'double the furosemide', 'he can go home', 'discharge him today']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after readiness', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(heartFailureInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(heartFailureInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(heartFailureInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.readinessAtTick).not.toBeNull();
    expect(heartFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(heartFailureInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
