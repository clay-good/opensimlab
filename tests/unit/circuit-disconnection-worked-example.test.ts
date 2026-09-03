/**
 * The worked example and observed-state tutor for a fix everybody wants to
 * reach for first.
 *
 * The cause really is a disconnected circuit and reconnecting it really is the
 * treatment, which is exactly why the bridge has to come first.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { VENTILATOR_CIRCUIT_DISCONNECTION as SCENARIO } from '../../src/modules/critical-care/scenarios/ventilator-circuit-disconnection';
import { CIRCUIT_DISCONNECTION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/circuit-disconnection-fixtures';
import {
  CIRCUIT_DISCONNECTION_DEMONSTRATION_VERSION, circuitDisconnectionDemonstrationStep,
  supportsCircuitDisconnectionDemonstration,
} from '../../src/modules/critical-care/demo/circuit-disconnection-demonstration';
import { circuitDisconnectionInlinePrompt } from '../../src/modules/critical-care/tutor/circuit-disconnection-guidance';
import type { CircuitDisconnectionAction } from '../../src/modules/critical-care/circuit-disconnection';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.ventilatorCircuitDisconnectionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CircuitDisconnectionAction) => {
  engine.apply({ tick, type: 'ventilator-circuit-disconnection-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = circuitDisconnectionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'ventilator-circuit-disconnection-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Bridges Before It Fixes', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CIRCUIT_DISCONNECTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCircuitDisconnectionDemonstration(SCENARIO)).toBe(true);
    expect(supportsCircuitDisconnectionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCircuitDisconnectionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'ventilator-circuit-disconnection-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognize', 'bridge', 'inspect', 'restore', 'reassess']);
    expect(patient.recognizedAtTick).toBeLessThan(patient.bridgedAtTick!);
    expect(patient.bridgedAtTick).toBeLessThan(patient.inspectedAtTick!);
    expect(patient.inspectedAtTick).toBeLessThan(patient.restoredAtTick!);
    expect(patient.restoredAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('separates the two facts that share a screen', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('two different facts and only the second one is about the patient');
    expect(recognize).toContain('not as a disconnect, which is a conclusion you have not yet earned');
  });

  it('calls the bridge the step everybody skips and says why', () => {
    const bridge = narrations[beats.indexOf('bridge')]!;
    expect(bridge).toContain('the one everybody skips');
    expect(bridge).toContain('exactly why the pull to go straight there is so strong');
    expect(bridge).toContain('the whole argument made structural');
  });

  it('gives the direction of the trace and keeps alternatives open', () => {
    const inspect = narrations[beats.indexOf('inspect')]!;
    expect(inspect).toContain('starting at the machine is how a team spends a minute on a device that is working perfectly');
    expect(inspect).toContain('the alternatives stay open while you trace');
  });

  it('restores the established support without improving it', () => {
    const restore = narrations[beats.indexOf('restore')]!;
    expect(restore).toContain('nothing to invent here and nothing to improve while you are at it');
    expect(restore).toContain('can reconnect it to a second problem');
  });

  it('refuses to close on a quiet alarm', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('Every one of those is doing a job');
    expect(reassess).toContain('only that a threshold is no longer being crossed');
    expect(narration).toContain('a delivered breath was');
  });

  it('never reconnects, handles equipment, names a bag or a setting, or closes on the alarm', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['reconnect the limb yourself', 'grab the bag-valve', 'set peep to 10',
      'the alarm has stopped so he is fine', 'switch to a new ventilator']) {
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
      const prompt = circuitDisconnectionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['vcd-recognize', 'vcd-bridge', 'vcd-inspect', 'vcd-restore', 'vcd-reassess']);
  });

  it('stays on the bridge when the circuit trace is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-ventilator-circuit-disconnection');
    advance(engine, 1, 'inspect-ventilator-circuit-disconnection');
    expect(snapshot(engine)!.inspectedAtTick).toBeNull();
    const prompt = circuitDisconnectionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('vcd-bridge');
    expect(prompt.suggestion).toContain('before you go looking for the join');
  });

  it('stays on the inspection when restoration is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-ventilator-circuit-disconnection');
    advance(engine, 1, 'bridge-ventilator-circuit-disconnection');
    advance(engine, 2, 'restore-ventilator-circuit-support');
    expect(snapshot(engine)!.restoredAtTick).toBeNull();
    expect(circuitDisconnectionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('vcd-inspect');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'bridge-ventilator-circuit-disconnection');
    expect(snapshot(engine)!.bridgedAtTick).toBeNull();
    expect(circuitDisconnectionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('vcd-recognize');
  });

  it('never reconnects, handles equipment, or closes on the alarm', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = circuitDisconnectionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['reconnect the limb yourself', 'grab the bag-valve', 'the alarm has stopped so he is fine']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(circuitDisconnectionInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(circuitDisconnectionInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(circuitDisconnectionInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(circuitDisconnectionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(circuitDisconnectionInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
