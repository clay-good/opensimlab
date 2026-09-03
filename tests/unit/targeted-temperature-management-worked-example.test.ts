/**
 * The worked example and observed-state tutor for a number a generation was
 * taught to reach for.
 *
 * The engine records a range in which nothing is superior, so the decision is
 * to control temperature deliberately and not let her get hot — and an
 * unresponsive examination at thirty-two minutes is eligibility, not prognosis.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { TARGETED_TEMPERATURE_MANAGEMENT as SCENARIO } from '../../src/modules/critical-care/scenarios/targeted-temperature-management';
import { TARGETED_TEMPERATURE_MANAGEMENT_FIXTURES as FIXTURES } from '../../src/modules/critical-care/targeted-temperature-management-fixtures';
import {
  TARGETED_TEMPERATURE_MANAGEMENT_DEMONSTRATION_VERSION, targetedTemperatureManagementDemonstrationStep,
  supportsTargetedTemperatureManagementDemonstration,
} from '../../src/modules/critical-care/demo/targeted-temperature-management-demonstration';
import { targetedTemperatureManagementInlinePrompt } from '../../src/modules/critical-care/tutor/targeted-temperature-management-guidance';
import type { TargetedTemperatureManagementAction } from '../../src/modules/critical-care/targeted-temperature-management';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.postArrestTemperatureAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: TargetedTemperatureManagementAction) => {
  engine.apply({ tick, type: 'targeted-temperature-management-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = targetedTemperatureManagementDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'targeted-temperature-management-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Controls A Temperature Without Picking A Number', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(TARGETED_TEMPERATURE_MANAGEMENT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsTargetedTemperatureManagementDemonstration(SCENARIO)).toBe(true);
    expect(supportsTargetedTemperatureManagementDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsTargetedTemperatureManagementDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'targeted-temperature-management-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognize', 'context', 'protocol', 'guardrails', 'reassess']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.protocolAtTick!);
    expect(patient.protocolAtTick).toBeLessThan(patient.guardrailsAtTick!);
    expect(patient.guardrailsAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('separates eligibility from prognosis in the first beat', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('it is not what tells you how she does');
    expect(recognize).toContain('the examination is the least reliable thing in the room');
  });

  it('refuses to let any single sign carry a prognosis', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('reassuring and prove nothing');
    expect(context).toContain('a seizing brain is a hotter brain');
  });

  it('names the remembered number and says what replaced it', () => {
    const protocol = narrations[beats.indexOf('protocol')]!;
    expect(protocol).toContain('If you learned "cool to 33", that is the thing to notice');
    expect(protocol).toContain('the decision here is not which number');
  });

  it('names the two classic harms as harms', () => {
    const guardrails = narrations[beats.indexOf('guardrails')]!;
    expect(guardrails).toContain('a large volume into a heart that just arrested');
    expect(guardrails).toContain('undoes the point of having gone down');
  });

  it('is careful about the unchanged examination at the end', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('the number most likely to be misread');
    expect(narration).toContain('No number was picked and her temperature is controlled anyway');
  });

  it('never sets a target, cools, gives cold fluid, or makes a prognosis', () => {
    // Guard the instruction voice, not the nouns: several beats exist to refuse a
    // prognosis, so a bare noun match would fail on the lesson's own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['set the target to 33', 'start the cooling blanket now',
      'give 30 ml/kg of cold saline', 'give her a paralytic for the shivering',
      'she will not recover', 'her neurologic outcome is poor']) {
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
      const prompt = targetedTemperatureManagementInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ttm-recognize', 'ttm-context', 'ttm-protocol', 'ttm-guardrails', 'ttm-reassess']);
  });

  it('stays on the context when the protocol is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-post-arrest-temperature-control');
    advance(engine, 1, 'activate-post-arrest-temperature-protocol');
    expect(snapshot(engine)!.protocolAtTick).toBeNull();
    const prompt = targetedTemperatureManagementInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ttm-context');
    expect(prompt.suggestion).toContain('refuse to let any one sign mean something on its own');
  });

  it('stays on the protocol when the guardrails are reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-post-arrest-temperature-control');
    advance(engine, 1, 'review-post-arrest-temperature-context');
    advance(engine, 2, 'record-temperature-control-guardrails');
    expect(snapshot(engine)!.guardrailsAtTick).toBeNull();
    expect(targetedTemperatureManagementInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ttm-protocol');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-post-arrest-temperature-context');
    expect(snapshot(engine)!.contextAtTick).toBeNull();
    expect(targetedTemperatureManagementInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ttm-recognize');
  });

  it('never sets a target or starts a device anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = targetedTemperatureManagementInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['set the target to 33', 'start the cooling blanket now', 'give 30 ml/kg of cold saline']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(targetedTemperatureManagementInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(targetedTemperatureManagementInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(targetedTemperatureManagementInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(targetedTemperatureManagementInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(targetedTemperatureManagementInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
