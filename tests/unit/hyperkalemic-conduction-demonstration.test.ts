/**
 * The worked example and observed-state tutor for an ECG that got better
 * without the problem going away.
 *
 * The reflex both work against is the monitor. Calcium narrowed the QRS and
 * removed no potassium, and mistaking one for the other is how a treated
 * hyperkalemia becomes an untreated one.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { HYPERKALEMIC_CONDUCTION_DISTURBANCE as SCENARIO } from '../../src/modules/cardiology/scenarios/hyperkalemic-conduction-disturbance';
import { HYPERKALEMIC_CONDUCTION_FIXTURES as FIXTURES } from '../../src/modules/cardiology/hyperkalemic-conduction-fixtures';
import {
  HYPERKALEMIC_CONDUCTION_DEMONSTRATION_VERSION, hyperkalemicConductionDemonstrationStep,
  supportsHyperkalemicConductionDemonstration,
} from '../../src/modules/cardiology/demo/hyperkalemic-conduction-demonstration';
import { hyperkalemicConductionInlinePrompt } from '../../src/modules/cardiology/tutor/hyperkalemic-conduction-guidance';
import type { HyperkalemicConductionAction } from '../../src/modules/cardiology/hyperkalemic-conduction';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.hyperkalemicConductionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: HyperkalemicConductionAction) => {
  engine.apply({ tick, type: 'hyperkalemic-conduction-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = hyperkalemicConductionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'hyperkalemic-conduction-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reads The Chemistry, Not The Monitor', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(HYPERKALEMIC_CONDUCTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHyperkalemicConductionDemonstration(SCENARIO)).toBe(true);
    expect(supportsHyperkalemicConductionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsHyperkalemicConductionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('takes all six recorded steps, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(6);
    expect(beats).toEqual(['trajectory', 'lanes', 'shift', 'removal', 'panel', 'handoff']);
    expect(patient.reconciledAtTick).toBeLessThan(patient.calciumResponseAtTick!);
    expect(patient.calciumResponseAtTick).toBeLessThan(patient.shiftSurveillanceAtTick!);
    expect(patient.shiftSurveillanceAtTick).toBeLessThan(patient.removalDeviceAtTick!);
    expect(patient.removalDeviceAtTick).toBeLessThan(patient.laterPanelAtTick!);
    expect(patient.laterPanelAtTick).toBeLessThan(patient.handoffAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('holds three timepoints apart at the opening beat', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('Three timepoints, not one');
    expect(trajectory).toContain('the potassium in the immediate post-calcium record is still 6.9');
    expect(trajectory).toContain('not deciding yet that the potassium explains all of it');
  });

  it('says what the calcium did and did not do in the same breath', () => {
    const lanes = narrations[beats.indexOf('lanes')]!;
    expect(lanes).toContain('none of them queues behind the others');
    expect(lanes).toContain('calcium protects the membrane and removes no potassium at all');
    expect(lanes).toContain('the second half of that is the one that matters');
  });

  it('names both of the things shifting treatment creates', () => {
    const shift = narrations[beats.indexOf('shift')]!;
    expect(shift).toContain('the potassium comes back, which is what rebound means');
    expect(shift).toContain('the insulin outlasts the glucose');
  });

  it('defers the device question without forgetting it', () => {
    const removal = narrations[beats.indexOf('removal')]!;
    expect(removal).toContain('Shifting is a holding measure; removal is the treatment');
    expect(removal).toContain('a heart nobody has seen at a normal potassium');
    expect(removal).toContain('so deferring is not the same as forgetting');
    expect(patient.permanentDeviceSelected).toBe(false);
  });

  it('reads the later panel as one point on a line', () => {
    const panel = narrations[beats.indexOf('panel')]!;
    expect(panel).toContain('a serial measurement rather than a result');
    expect(panel).toContain('5.8 is not normal');
  });

  it('hands off the watching rather than a conclusion', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('Hand off the watching, not a conclusion');
    expect(narration).toContain('it has been moved, and it will come back');
    expect(narration).toContain('The ECG improving was the part that could have ended the review early.');
    expect(patient.treatmentDeliveredByLearner).toBe(false);
  });

  it('never names a dose, claims the potassium fell after calcium, or picks a device', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 10 ml of calcium gluconate', 'the calcium brought the potassium down',
      'implant a permanent pacemaker', 'start dialysis now', 'give 10 units of insulin']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Names Whichever Lanes Remain', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = hyperkalemicConductionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['hkc-trajectory', 'hkc-lanes', 'hkc-shift', 'hkc-removal', 'hkc-panel', 'hkc-handoff']);
  });

  it('names the calcium lane when the other two went first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-hyperkalemic-conduction-trajectory');
    advance(engine, 1, 'review-hyperkalemic-conduction-removal-and-device-restraint');
    advance(engine, 2, 'review-hyperkalemic-conduction-shift-surveillance');
    const prompt = hyperkalemicConductionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hkc-calcium');
    expect(prompt.because).toContain('calcium does not remove potassium and was never going to');
    expect(prompt.because).toContain('they have bought time');
  });

  it('holds on the open lanes when the later panel is attempted early', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-hyperkalemic-conduction-trajectory');
    advance(engine, 1, 'review-hyperkalemic-conduction-calcium-response');
    advance(engine, 2, 'review-hyperkalemic-conduction-later-panel');
    expect(snapshot(engine)!.laterPanelAtTick).toBeNull();
    expect(hyperkalemicConductionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('hkc-shift');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-hyperkalemic-conduction-calcium-response');
    expect(snapshot(engine)!.calciumResponseAtTick).toBeNull();
    expect(hyperkalemicConductionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('hkc-trajectory');
  });

  it('never names a dose or claims the potassium fell after calcium', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = hyperkalemicConductionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give 10 ml of calcium gluconate', 'the calcium brought the potassium down',
        'implant a permanent pacemaker']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(hyperkalemicConductionInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(hyperkalemicConductionInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(hyperkalemicConductionInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(hyperkalemicConductionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(hyperkalemicConductionInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
