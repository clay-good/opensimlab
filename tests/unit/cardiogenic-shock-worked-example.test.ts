/**
 * The worked example and observed-state tutor for a shock the module's own
 * septic-shock lesson would treat wrongly.
 *
 * The reflexes both work against are the fluid a MAP of 58 asks for, and the
 * mechanical support a shocked anterior infarct asks for while the artery is
 * still shut.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { CARDIOGENIC_SHOCK as SCENARIO } from '../../src/modules/critical-care/scenarios/cardiogenic-shock';
import { CARDIOGENIC_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/critical-care/cardiogenic-shock-fixtures';
import {
  CARDIOGENIC_SHOCK_DEMONSTRATION_VERSION, cardiogenicShockDemonstrationStep,
  supportsCardiogenicShockDemonstration,
} from '../../src/modules/critical-care/demo/cardiogenic-shock-demonstration';
import { cardiogenicShockInlinePrompt } from '../../src/modules/critical-care/tutor/cardiogenic-shock-guidance';
import type { CardiogenicShockAction } from '../../src/modules/critical-care/cardiogenic-shock';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.cardiogenicShockAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CardiogenicShockAction) => {
  engine.apply({ tick, type: 'cardiogenic-shock-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = cardiogenicShockDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'cardiogenic-shock-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Give Fluid Or Reach For A Device', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CARDIOGENIC_SHOCK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCardiogenicShockDemonstration(SCENARIO)).toBe(true);
    expect(supportsCardiogenicShockDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCardiogenicShockDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'cardiogenic-shock-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognition', 'phenotype', 'bridge', 'cause', 'reassessment']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.phenotypeAtTick!);
    expect(patient.phenotypeAtTick).toBeLessThan(patient.bridgeAtTick!);
    expect(patient.bridgeAtTick).toBeLessThan(patient.causeControlAtTick!);
    expect(patient.causeControlAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('calls the pressure the least interesting number on the screen', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('The MAP is the least interesting number there');
    expect(recognition).toContain('off the trajectory rather than off a diagnosis');
  });

  it('treats the echo’s negatives as the load-bearing part', () => {
    const phenotype = narrations[beats.indexOf('phenotype')]!;
    expect(phenotype).toContain('Every one of those negatives is doing work');
    expect(phenotype).toContain('would need a surgeon rather than a vasopressor');
    expect(phenotype).toContain('would go into his lungs');
  });

  it('names the instinct the septic-shock lesson taught and says it is wrong here', () => {
    const bridge = narrations[beats.indexOf('bridge')]!;
    expect(bridge).toContain('primary fluid loading has nowhere useful to go');
    expect(bridge).toContain('the same instinct that was right there is wrong here');
  });

  it('puts the artery ahead of the device', () => {
    const cause = narrations[beats.indexOf('cause')]!;
    expect(cause).toContain('support layered onto an artery that is still shut');
    expect(cause).toContain('no device here is routine');
  });

  it('refuses to let improvement close anything', () => {
    const reassessment = narrations[beats.indexOf('reassessment')]!;
    expect(reassessment).toContain('the artery is the shock and it is not open yet');
    expect(narration).toContain('His numbers are better and his artery is shut');
  });

  it('never names a vasopressor dose, a pressure target, a device, or a fluid volume', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start noradrenaline at 0.1', 'aim for a map of 65', 'insert an impella',
      'place a balloon pump', 'give 500 ml', 'start dobutamine at']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Chain', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = cardiogenicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['cgs-recognition', 'cgs-phenotype', 'cgs-bridge', 'cgs-cause', 'cgs-reassessment']);
  });

  it('stays on the phenotype when the bridge is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-cardiogenic-shock-trajectory');
    advance(engine, 1, 'record-cardiogenic-shock-bridge');
    expect(snapshot(engine)!.bridgeAtTick).toBeNull();
    const prompt = cardiogenicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('cgs-phenotype');
    expect(prompt.suggestion).toContain('Look at the heart before you support it');
  });

  it('stays on the bridge when cause control is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-cardiogenic-shock-trajectory');
    advance(engine, 1, 'review-cardiogenic-shock-cause-and-phenotype');
    advance(engine, 2, 'escalate-cardiogenic-shock-cause-control');
    expect(snapshot(engine)!.causeControlAtTick).toBeNull();
    expect(cardiogenicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('cgs-bridge');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-cardiogenic-shock-cause-and-phenotype');
    expect(snapshot(engine)!.phenotypeAtTick).toBeNull();
    expect(cardiogenicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('cgs-recognition');
  });

  it('never names a dose, a target, or a device', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = cardiogenicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['start noradrenaline at 0.1', 'aim for a map of 65', 'insert an impella']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(cardiogenicShockInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(cardiogenicShockInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(cardiogenicShockInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(cardiogenicShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(cardiogenicShockInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
