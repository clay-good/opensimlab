/**
 * The worked example and observed-state tutor for a pressure that improved and
 * a patient who did not.
 *
 * Two disciplines: a MAP is not a flow, and no device gets chosen in this
 * building.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { POST_INFARCTION_CARDIOGENIC_SHOCK_ESCALATION as SCENARIO } from '../../src/modules/cardiology/scenarios/post-infarction-cardiogenic-shock-escalation';
import { POST_INFARCTION_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/cardiology/post-infarction-shock-fixtures';
import {
  POST_INFARCTION_SHOCK_DEMONSTRATION_VERSION, postInfarctionShockDemonstrationStep,
  supportsPostInfarctionShockDemonstration,
} from '../../src/modules/cardiology/demo/post-infarction-shock-demonstration';
import { postInfarctionShockInlinePrompt } from '../../src/modules/cardiology/tutor/post-infarction-shock-guidance';
import type { PostInfarctionShockAction } from '../../src/modules/cardiology/post-infarction-shock';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.postInfarctionShockAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PostInfarctionShockAction) => {
  engine.apply({ tick, type: 'post-infarction-shock-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = postInfarctionShockDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'post-infarction-shock-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses The Pressure', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(POST_INFARCTION_SHOCK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPostInfarctionShockDemonstration(SCENARIO)).toBe(true);
    expect(supportsPostInfarctionShockDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPostInfarctionShockDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all five steps, taking the pair causes-first', () => {
    expect(beats).toEqual(['trajectory', 'causes', 'transfer', 'bridge', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.causesAtTick!);
    // One valid order of the unordered pair, not the only one.
    expect(patient.causesAtTick).toBeLessThan(patient.transferAtTick!);
    expect(patient.transferAtTick).toBeLessThan(patient.bridgeAtTick!);
    expect(patient.bridgeAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('says a MAP is a pressure rather than a flow', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('A MAP is a pressure, not a flow');
    expect(trajectory).toContain('what it looks like when the two come apart');
    expect(patient.pressureAloneUsed).toBe(false);
  });

  it('treats the fixed reports as six hours old', () => {
    const causes = narrations[beats.indexOf('causes')]!;
    expect(causes).toContain('"Immediately after PCI" is six hours ago');
    expect(causes).toContain('whose diagnosis may have changed since the last picture of it');
  });

  it('makes the escalation a phone call rather than a decision', () => {
    const transfer = narrations[beats.indexOf('transfer')]!;
    expect(transfer).toContain('a phone call rather than a decision');
    expect(transfer).toContain('not recoverable by making it well');
  });

  it('refuses the pull toward a device by name', () => {
    const bridge = narrations[beats.indexOf('bridge')]!;
    expect(bridge).toContain('no device is selected');
    expect(bridge).toContain('about whether, for whom, and by whom');
    expect(patient.routineDeviceSelected).toBe(false);
  });

  it('ends with the transfer still undecided', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('whether or when transfer occurs');
    expect(narration).toContain('no device was chosen by anyone in this building');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('never names a device, an agent, a target, or a destination', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start an impella', 'insert a balloon pump', 'start ecmo', 'give norepinephrine', 'target a map of', 'transfer her to']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(patient.treatmentDelivered).toBe(false);
  });
});

describe('Requirement: The Tutor Covers Both Halves Of The Unordered Pair', () => {
  const V = '0.1.0';
  const atTrajectory = () => {
    const engine = create();
    advance(engine, 0, 'reconcile-post-infarction-shock-trajectory');
    return engine;
  };

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = postInfarctionShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pis-trajectory', 'pis-parallel', 'pis-transfer', 'pis-bridge', 'pis-handoff']);
  });

  it('asks for both when neither has started', () => {
    const prompt = postInfarctionShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(atTrajectory()) })!;
    expect(prompt.id).toBe('pis-parallel');
    expect(prompt.suggestion).toContain('phone people who can do more than you can');
  });

  it('sends the learner back to the diagnosis when the call went first', () => {
    const engine = atTrajectory();
    advance(engine, 1, 'contact-post-infarction-shock-center');
    expect(snapshot(engine)!.transferAtTick).not.toBeNull();
    expect(snapshot(engine)!.causesAtTick).toBeNull();
    const prompt = postInfarctionShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pis-causes');
    expect(prompt.suggestion).toContain('The call is made');
    expect(prompt.because).toContain('is a poor answer in a patient who is deteriorating');
  });

  it('names the hospital when the causes went first', () => {
    const engine = atTrajectory();
    advance(engine, 1, 'reopen-post-infarction-shock-causes');
    expect(snapshot(engine)!.causesAtTick).not.toBeNull();
    expect(snapshot(engine)!.transferAtTick).toBeNull();
    const prompt = postInfarctionShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pis-transfer');
    expect(prompt.suggestion).toContain('still in a hospital that cannot do this');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-post-infarction-shock-bridge');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.bridgeAtTick).toBeNull();
    expect(postInfarctionShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pis-trajectory');
  });

  it('does not move on when the handoff is refused for time', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'post-infarction-shock-response', payload: { action: 'record-post-infarction-shock-bridge' } });
    engine.apply({ tick: 3, type: 'post-infarction-shock-response', payload: { action: 'handoff-post-infarction-shock-trajectory' } });
    engine.step();
    expect(snapshot(engine)!.bridgeAtTick).not.toBeNull();
    expect(snapshot(engine)!.handoffAtTick).toBeNull();
    expect(postInfarctionShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pis-handoff');
  });

  it('never names a device, an agent, or a destination', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = postInfarctionShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['start an impella', 'start ecmo', 'give norepinephrine', 'transfer her to']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(postInfarctionShockInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(postInfarctionShockInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(postInfarctionShockInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(postInfarctionShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(postInfarctionShockInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
