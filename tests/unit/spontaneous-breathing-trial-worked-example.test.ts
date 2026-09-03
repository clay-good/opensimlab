/**
 * The worked example and observed-state tutor for the one lesson in this module
 * that ends in a failure.
 *
 * A trial that goes badly is information about a reversible list, not a verdict
 * on the patient — and a trial that goes well is not permission to extubate.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SPONTANEOUS_BREATHING_TRIAL as SCENARIO } from '../../src/modules/critical-care/scenarios/spontaneous-breathing-trial';
import { SPONTANEOUS_BREATHING_TRIAL_FIXTURES as FIXTURES } from '../../src/modules/critical-care/spontaneous-breathing-trial-fixtures';
import {
  SPONTANEOUS_BREATHING_TRIAL_DEMONSTRATION_VERSION, spontaneousBreathingTrialDemonstrationStep,
  supportsSpontaneousBreathingTrialDemonstration,
} from '../../src/modules/critical-care/demo/spontaneous-breathing-trial-demonstration';
import { spontaneousBreathingTrialInlinePrompt } from '../../src/modules/critical-care/tutor/spontaneous-breathing-trial-guidance';
import type { SpontaneousBreathingTrialAction } from '../../src/modules/critical-care/spontaneous-breathing-trial';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.spontaneousBreathingTrialAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: SpontaneousBreathingTrialAction) => {
  engine.apply({ tick, type: 'spontaneous-breathing-trial-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = spontaneousBreathingTrialDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'spontaneous-breathing-trial-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Ends In A Failure On Purpose', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SPONTANEOUS_BREATHING_TRIAL_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSpontaneousBreathingTrialDemonstration(SCENARIO)).toBe(true);
    expect(supportsSpontaneousBreathingTrialDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsSpontaneousBreathingTrialDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'spontaneous-breathing-trial-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['readiness', 'start', 'failure', 'recovery', 'plan']);
    expect(patient.readinessAtTick).toBeLessThan(patient.startedAtTick!);
    expect(patient.startedAtTick).toBeLessThan(patient.failureAtTick!);
    expect(patient.failureAtTick).toBeLessThan(patient.recoveryAtTick!);
    expect(patient.recoveryAtTick).toBeLessThan(patient.planAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('declines the index gate and says why', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('delays extubation more often than it prevents one');
    expect(readiness).toContain('teaches you nothing except that she failed');
  });

  it('makes the unchanged oxygen and the local method deliberate', () => {
    const start = narrations[beats.indexOf('start')]!;
    expect(start).toContain('raising it hides exactly the oxygenation change you are testing for');
    expect(start).toContain('so the decision to stop is not made by whoever gets nervous first');
  });

  it('refuses single thresholds by taking the panel apart', () => {
    const failure = narrations[beats.indexOf('failure')]!;
    expect(failure).toContain('each has an excuse');
    expect(failure).toContain('That convergence is what makes this failure');
  });

  it('argues for stopping early rather than late', () => {
    const recovery = narrations[beats.indexOf('recovery')]!;
    expect(recovery).toContain('fatigue makes the next trial worse');
  });

  it('carries the opposite-end error into the plan and the ending', () => {
    const plan = narrations[beats.indexOf('plan')]!;
    expect(plan).toContain('The failure is a list, not a verdict');
    expect(plan).toContain('Tolerating a trial says the breathing works');
    expect(narration).toContain('nobody would have been on a good trial either');
  });

  it('never extubates, sets a ventilator target, or promises she comes off', () => {
    // Guard the instruction voice, not the nouns: the plan beat exists to say
    // extubation is NOT recorded, so a bare noun match would fail on its own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['extubate her now', 'set the rate to 16', 'stop the sedation infusion',
      'her rsbi is', 'she will come off tomorrow', 'she is ready for extubation']) {
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
      const prompt = spontaneousBreathingTrialInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['sbt-readiness', 'sbt-start', 'sbt-failure', 'sbt-recovery', 'sbt-plan']);
  });

  it('stays on readiness when the trial is started first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'start-bounded-sbt');
    expect(snapshot(engine)!.startedAtTick).toBeNull();
    const prompt = spontaneousBreathingTrialInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('sbt-readiness');
    expect(prompt.suggestion).toContain('do not wait for an index to say so');
  });

  it('stays on the recovery when the plan is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-sbt-readiness');
    advance(engine, 1, 'start-bounded-sbt');
    advance(engine, 2, 'recognize-sbt-failure');
    advance(engine, 3, 'plan-after-failed-sbt');
    expect(snapshot(engine)!.planAtTick).toBeNull();
    expect(spontaneousBreathingTrialInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('sbt-recovery');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-sbt-failure');
    expect(snapshot(engine)!.failureAtTick).toBeNull();
    expect(spontaneousBreathingTrialInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('sbt-readiness');
  });

  it('never extubates or names a setting anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = spontaneousBreathingTrialInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['extubate her now', 'set the rate to 16', 'her rsbi is']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the plan', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(spontaneousBreathingTrialInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(spontaneousBreathingTrialInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(spontaneousBreathingTrialInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.planAtTick).not.toBeNull();
    expect(spontaneousBreathingTrialInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(spontaneousBreathingTrialInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
