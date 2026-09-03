/**
 * The worked example and observed-state tutor for a patient whose two obvious
 * treatments are both wrong.
 *
 * She is grossly congested, which asks for a diuretic, and hypotensive and
 * underperfused, which asks for fluid. A central venous pressure of 18 against
 * a wedge of 10 is what rules out both.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { RIGHT_VENTRICULAR_FAILURE as SCENARIO } from '../../src/modules/critical-care/scenarios/right-ventricular-failure';
import { RV_FAILURE_FIXTURES as FIXTURES } from '../../src/modules/critical-care/rv-failure-fixtures';
import {
  RV_FAILURE_DEMONSTRATION_VERSION, rvFailureDemonstrationStep, supportsRvFailureDemonstration,
} from '../../src/modules/critical-care/demo/rv-failure-demonstration';
import { rvFailureInlinePrompt } from '../../src/modules/critical-care/tutor/rv-failure-guidance';
import type { RvFailureAction } from '../../src/modules/critical-care/rv-failure';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.rightVentricularFailureAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: RvFailureAction) => {
  engine.apply({ tick, type: 'right-ventricular-failure-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = rvFailureDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'right-ventricular-failure-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Gives Neither Fluid Nor A Diuretic', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(RV_FAILURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRvFailureDemonstration(SCENARIO)).toBe(true);
    expect(supportsRvFailureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsRvFailureDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'right-ventricular-failure-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognition', 'phenotype', 'support', 'triggers', 'reassessment']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.phenotypeAtTick!);
    expect(patient.phenotypeAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.triggersAtTick!);
    expect(patient.triggersAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('locates the problem on the right from congestion without pulmonary oedema', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('that combination is right-sided');
    expect(recognition).toContain('the interrupted therapy is the part of the history most likely to explain why now');
  });

  it('reads the two filling pressures against each other', () => {
    const phenotype = narrations[beats.indexOf('phenotype')]!;
    expect(phenotype).toContain('18 on the right and 10 on the left is where the congestion is and where it is not');
    expect(phenotype).toContain('not because she is dry');
    expect(phenotype).toContain('the same fact seen a second way');
  });

  it('rules out both reflexes without forbidding either in principle', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('this ventricle tolerates neither reflex');
    expect(support).toContain('what is excluded is doing either automatically');
  });

  it('treats restarting the interrupted therapy as a specialist decision', () => {
    const triggers = narrations[beats.indexOf('triggers')]!;
    expect(triggers).toContain('a specialist decision rather than a resumption');
    expect(triggers).toContain('both consequences of her state and causes of it getting worse');
  });

  it('keeps the reassessment plural and claims no resolution', () => {
    const reassessment = narrations[beats.indexOf('reassessment')]!;
    expect(reassessment).toContain('can look better on one axis while another is quietly worse');
    expect(narration).toContain('No fluid went in and no diuretic went in');
    expect(narration).toContain('was the sentence that decided it');
  });

  it('never names a diuretic, a fluid volume, a target, or a pulmonary-vascular agent', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give furosemide', 'give 500 ml', 'aim for a map of 65',
      'restart the epoprostenol', 'start inhaled nitric oxide', 'give a fluid challenge of']) {
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
      const prompt = rvFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['rvf-recognition', 'rvf-phenotype', 'rvf-support', 'rvf-triggers', 'rvf-reassessment']);
  });

  it('stays on the phenotype when support is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-rv-failure-trajectory');
    advance(engine, 1, 'record-rv-failure-support');
    expect(snapshot(engine)!.supportAtTick).toBeNull();
    const prompt = rvFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('rvf-phenotype');
    expect(prompt.suggestion).toContain('do not let one number decide');
  });

  it('stays on support when the triggers are reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-rv-failure-trajectory');
    advance(engine, 1, 'review-rv-failure-phenotype');
    advance(engine, 2, 'address-rv-failure-triggers');
    expect(snapshot(engine)!.triggersAtTick).toBeNull();
    expect(rvFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('rvf-support');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-rv-failure-phenotype');
    expect(snapshot(engine)!.phenotypeAtTick).toBeNull();
    expect(rvFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('rvf-recognition');
  });

  it('never names a diuretic, a fluid volume, or a target', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = rvFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['give furosemide', 'give 500 ml', 'aim for a map of 65']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(rvFailureInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(rvFailureInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(rvFailureInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(rvFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(rvFailureInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
