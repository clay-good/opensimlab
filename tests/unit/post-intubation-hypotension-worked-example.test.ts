/**
 * The worked example and observed-state tutor for hypotension that already has
 * an explanation.
 *
 * He was intubated for septic shock, so the sedation-plus-positive-pressure
 * story fits perfectly — which is why the dangerous alternatives get checked
 * rather than dismissed.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { POST_INTUBATION_HYPOTENSION as SCENARIO } from '../../src/modules/critical-care/scenarios/post-intubation-hypotension';
import { POST_INTUBATION_HYPOTENSION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/post-intubation-hypotension-fixtures';
import {
  POST_INTUBATION_HYPOTENSION_DEMONSTRATION_VERSION, postIntubationHypotensionDemonstrationStep,
  supportsPostIntubationHypotensionDemonstration,
} from '../../src/modules/critical-care/demo/post-intubation-hypotension-demonstration';
import { postIntubationHypotensionInlinePrompt } from '../../src/modules/critical-care/tutor/post-intubation-hypotension-guidance';
import type { PostIntubationHypotensionAction } from '../../src/modules/critical-care/post-intubation-hypotension';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.postIntubationHypotensionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PostIntubationHypotensionAction) => {
  engine.apply({ tick, type: 'post-intubation-hypotension-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = postIntubationHypotensionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'post-intubation-hypotension-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Checks The Story It Already Believes', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(POST_INTUBATION_HYPOTENSION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPostIntubationHypotensionDemonstration(SCENARIO)).toBe(true);
    expect(supportsPostIntubationHypotensionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPostIntubationHypotensionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'post-intubation-hypotension-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['pressure', 'danger', 'mechanism', 'support', 'reassess']);
    expect(patient.pressureAtTick).toBeLessThan(patient.dangerAtTick!);
    expect(patient.dangerAtTick).toBeLessThan(patient.mechanismAtTick!);
    expect(patient.mechanismAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('makes the waveform what turns a reading into a pressure', () => {
    const pressure = narrations[beats.indexOf('pressure')]!;
    expect(pressure).toContain('a damped or disconnected line gives you the same panic for nothing');
    expect(pressure).toContain('a finding rather than a contradiction');
  });

  it('says the story is probably right and checks it anyway', () => {
    const danger = narrations[beats.indexOf('danger')]!;
    expect(danger).toContain('that story is probably right');
    expect(danger).toContain('It is also the reason this step exists');
    expect(danger).toContain('checked rather than dismissed');
  });

  it('uses the measurement rather than an impression and keeps causes open', () => {
    const mechanism = narrations[beats.indexOf('mechanism')]!;
    expect(mechanism).toContain('a measurement rather than a guess');
    expect(mechanism).toContain('The word that earns its place here is "while"');
  });

  it('declines the fluid-versus-vasopressor argument', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('not an open fluid commitment');
    expect(support).toContain('not a universal fluid-versus-vasopressor answer');
  });

  it('returns the learner to the disease the complication interrupted', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('only a challenge if somebody looks');
    expect(reassess).toContain('a complication of the treatment rather than the disease');
    expect(narration).toContain('still has pneumonia and septic shock');
  });

  it('never names a vasopressor dose, gives fluid, decompresses, or claims the shock is treated', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start noradrenaline at 0.1', 'give the 250 ml now yourself',
      'needle the chest', 'the septic shock is treated', 'give 30 ml/kg']) {
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
      const prompt = postIntubationHypotensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pih-pressure', 'pih-danger', 'pih-mechanism', 'pih-support', 'pih-reassess']);
  });

  it('stays on the danger review when the mechanism is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'validate-post-intubation-pressure-and-call-help');
    advance(engine, 1, 'classify-post-intubation-hemodynamics');
    expect(snapshot(engine)!.mechanismAtTick).toBeNull();
    const prompt = postIntubationHypotensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pih-danger');
    expect(prompt.suggestion).toContain('rule out the things that kill in the next few minutes');
  });

  it('stays on the mechanism when support is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'validate-post-intubation-pressure-and-call-help');
    advance(engine, 1, 'review-post-intubation-danger-pattern');
    advance(engine, 2, 'record-post-intubation-support-intent');
    expect(snapshot(engine)!.supportAtTick).toBeNull();
    expect(postIntubationHypotensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pih-mechanism');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-post-intubation-danger-pattern');
    expect(snapshot(engine)!.dangerAtTick).toBeNull();
    expect(postIntubationHypotensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pih-pressure');
  });

  it('never names a dose or decompresses a chest', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = postIntubationHypotensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['start noradrenaline at 0.1', 'needle the chest', 'give 30 ml/kg']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(postIntubationHypotensionInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(postIntubationHypotensionInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(postIntubationHypotensionInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(postIntubationHypotensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(postIntubationHypotensionInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
