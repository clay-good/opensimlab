/**
 * The worked example and observed-state tutor for a pump that is telling the
 * truth about itself.
 *
 * RUNNING is a claim about a motor. The lesson is the four states the engine
 * keeps apart, and the second reflex it interrupts is the helpful one: knowing
 * the drug sits in the tubing makes pushing it obvious, and pushing it is a
 * concentrated vasopressor bolus.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { DELAYED_VASOPRESSOR_DELIVERY as SCENARIO } from '../../src/modules/critical-care/scenarios/delayed-vasopressor-delivery';
import { DELAYED_VASOPRESSOR_DELIVERY_FIXTURES as FIXTURES } from '../../src/modules/critical-care/delayed-vasopressor-delivery-fixtures';
import {
  DELAYED_VASOPRESSOR_DELIVERY_DEMONSTRATION_VERSION, delayedVasopressorDeliveryDemonstrationStep,
  supportsDelayedVasopressorDeliveryDemonstration,
} from '../../src/modules/critical-care/demo/delayed-vasopressor-delivery-demonstration';
import { delayedVasopressorDeliveryInlinePrompt } from '../../src/modules/critical-care/tutor/delayed-vasopressor-delivery-guidance';
import type { DelayedVasopressorDeliveryAction } from '../../src/modules/critical-care/delayed-vasopressor-delivery';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.delayedVasopressorDeliveryAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: DelayedVasopressorDeliveryAction) => {
  engine.apply({ tick, type: 'delayed-vasopressor-delivery-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = delayedVasopressorDeliveryDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'delayed-vasopressor-delivery-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses To Read RUNNING As Delivery', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(DELAYED_VASOPRESSOR_DELIVERY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDelayedVasopressorDeliveryDemonstration(SCENARIO)).toBe(true);
    expect(supportsDelayedVasopressorDeliveryDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsDelayedVasopressorDeliveryDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'delayed-vasopressor-delivery-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['discordance', 'path', 'classify', 'protocol', 'reassess']);
    expect(patient.discordanceAtTick).toBeLessThan(patient.pathAtTick!);
    expect(patient.pathAtTick).toBeLessThan(patient.classifiedAtTick!);
    expect(patient.classifiedAtTick).toBeLessThan(patient.protocolAtTick!);
    expect(patient.protocolAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('holds the four states apart instead of explaining the numbers away', () => {
    const discordance = narrations[beats.indexOf('discordance')]!;
    expect(discordance).toContain('a claim about a motor');
    expect(discordance).toContain('Any one of those can be true while the next is not');
  });

  it('sits with the 0.6 mL rather than reciting it', () => {
    const path = narrations[beats.indexOf('path')]!;
    expect(path).toContain('a drug-free downstream segment is a transit time');
    expect(path).toContain('turning without yet having pushed a full column');
    expect(path).toContain('It is reviewed, from the record');
  });

  it('says what a good fit does not exclude', () => {
    const classify = narrations[beats.indexOf('classify')]!;
    expect(classify).toContain('a good fit is exactly when a list gets abandoned');
    expect(classify).toContain('a classification, not a diagnosis');
  });

  it('names the fix that hurts and refuses it', () => {
    const protocol = narrations[beats.indexOf('protocol')]!;
    expect(protocol).toContain('flushing or purging it becomes the obvious fix');
    expect(protocol).toContain('an uncontrolled bolus into a woman with a MAP of 54');
    expect(protocol).toContain('cannot be recited from here');
  });

  it('separates evidenced delivery from a treated shock', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('a better half-hour, not a treated shock');
    expect(narration).toContain('Nobody flushed the line and the drug arrived anyway');
  });

  it('never flushes the line, programs the pump, or claims the shock is treated', () => {
    // Guard the instruction voice, not the nouns: several beats exist to say the
    // shock is NOT treated, so a bare noun match would fail on the lesson's own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['flush the line now', 'prime the set yourself', 'set the pump to',
      'increase the rate to', 'her shock is treated', 'the source is now controlled']) {
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
      const prompt = delayedVasopressorDeliveryInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['dvd-discordance', 'dvd-path', 'dvd-classify', 'dvd-protocol', 'dvd-reassess']);
  });

  it('stays on the trace when the classification is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-vasopressor-command-delivery-discordance');
    advance(engine, 1, 'classify-vasopressor-dead-space-startup-delay');
    expect(snapshot(engine)!.classifiedAtTick).toBeNull();
    const prompt = delayedVasopressorDeliveryInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('dvd-path');
    expect(prompt.suggestion).toContain('Follow the drug from the syringe to her');
  });

  it('stays on the classification when the safety plan is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-vasopressor-command-delivery-discordance');
    advance(engine, 1, 'trace-vasopressor-source-to-patient-path');
    advance(engine, 2, 'activate-vasopressor-startup-safety-plan');
    expect(snapshot(engine)!.protocolAtTick).toBeNull();
    expect(delayedVasopressorDeliveryInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('dvd-classify');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'trace-vasopressor-source-to-patient-path');
    expect(snapshot(engine)!.pathAtTick).toBeNull();
    expect(delayedVasopressorDeliveryInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('dvd-discordance');
  });

  it('never flushes or programs anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = delayedVasopressorDeliveryInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['flush the line now', 'prime the set yourself', 'set the pump to']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(delayedVasopressorDeliveryInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(delayedVasopressorDeliveryInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(delayedVasopressorDeliveryInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(delayedVasopressorDeliveryInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(delayedVasopressorDeliveryInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
