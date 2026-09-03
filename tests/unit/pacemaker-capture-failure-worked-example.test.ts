/**
 * The worked example and observed-state tutor for a monitor counting the wrong
 * thing.
 *
 * The reflexes both work against are the displayed paced rate, and the pull of
 * a device problem towards troubleshooting while a dependent patient sits at
 * 32/min.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PACEMAKER_CAPTURE_FAILURE as SCENARIO } from '../../src/modules/cardiology/scenarios/pacemaker-capture-failure';
import { PACEMAKER_CAPTURE_FAILURE_FIXTURES as FIXTURES } from '../../src/modules/cardiology/pacemaker-capture-failure-fixtures';
import {
  PACEMAKER_CAPTURE_FAILURE_DEMONSTRATION_VERSION, pacemakerCaptureFailureDemonstrationStep,
  supportsPacemakerCaptureFailureDemonstration,
} from '../../src/modules/cardiology/demo/pacemaker-capture-failure-demonstration';
import { pacemakerCaptureFailureInlinePrompt } from '../../src/modules/cardiology/tutor/pacemaker-capture-failure-guidance';
import type { PacemakerCaptureFailureAction } from '../../src/modules/cardiology/pacemaker-capture-failure';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pacemakerCaptureFailureAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PacemakerCaptureFailureAction) => {
  engine.apply({ tick, type: 'pacemaker-capture-failure-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pacemakerCaptureFailureDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pacemaker-capture-failure-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Rescues Before It Explains', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PACEMAKER_CAPTURE_FAILURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPacemakerCaptureFailureDemonstration(SCENARIO)).toBe(true);
    expect(supportsPacemakerCaptureFailureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPacemakerCaptureFailureDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.id !== 'pacemaker-capture-failure-boundary'),
    })).toBe(false);
  });

  it('takes all six recorded steps, rescue before either troubleshooting lane', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(6);
    expect(beats).toEqual(['recognition', 'lanes', 'device', 'causes', 'panel', 'handoff']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.rescueAtTick!);
    expect(patient.rescueAtTick).toBeLessThan(patient.deviceSystemAtTick!);
    expect(patient.deviceSystemAtTick).toBeLessThan(patient.causesAtTick!);
    expect(patient.causesAtTick).toBeLessThan(patient.laterPanelAtTick!);
    expect(patient.laterPanelAtTick).toBeLessThan(patient.handoffAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('separates the electrical event from the mechanical one', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('a spike is an electrical event and a heartbeat is a mechanical one');
    expect(recognition).toContain('the display is counting the wrong thing');
    expect(recognition).toContain('this device is his heart rate');
    expect(patient.electricalCaptureFailureAuthored).toBe(true);
  });

  it('carries the reason the rescue cannot queue on the path the example takes', () => {
    const lanes = narrations[beats.indexOf('lanes')]!;
    expect(lanes).toContain('Rescue is in this group rather than in front of it');
    expect(lanes).toContain('cannot wait for anybody to understand his lead');
    // The example never reaches the beat for the lane it took.
    expect(lanes).toContain('measured in a handful of beats');
    expect(lanes).toContain('arranging the rescue does not close the review');
  });

  it('reads the interrogation as trends and names the finding that explains it', () => {
    const device = narrations[beats.indexOf('device')]!;
    expect(device).toContain('the output has not changed, the threshold has climbed past it');
    expect(device).toContain('it points rather than proves');
    expect(patient.deviceInterrogatedByLearner).toBe(false);
  });

  it('says a narrowed differential is not a closed one', () => {
    const causes = narrations[beats.indexOf('causes')]!;
    expect(causes).toContain('does not exclude one');
    expect(causes).toContain('narrowed by findings rather than closed by them');
  });

  it('keeps the programming change temporary and somebody else’s', () => {
    const panel = narrations[beats.indexOf('panel')]!;
    expect(panel).toContain('no setting is exposed here as a recipe');
    expect(panel).toContain('the word doing the work is temporary');
    expect(panel).toContain('He is captured again and he is not repaired');
    expect(patient.deviceProgrammedByLearner).toBe(false);
  });

  it('hands off a bridge rather than a solution', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('Hand off a bridge, not a solution');
    expect(handoff).toContain('temporary stability is not permission to stop watching');
    expect(narration).toContain('pointing is not proving');
    expect(narration).toContain('The rescue never waited for the explanation');
  });

  it('never programs, names an output, claims a fracture, or sets a threshold', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['program the output to 5 v', 'the lead is fractured',
      'above 1,000 ohms means', 'replace the lead', 'pace at 80']) {
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
      const prompt = pacemakerCaptureFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pcf-recognition', 'pcf-lanes', 'pcf-device', 'pcf-causes', 'pcf-panel', 'pcf-handoff']);
  });

  it('names the rescue when both troubleshooting lanes went first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-pacemaker-capture-failure-pulse-and-pattern');
    advance(engine, 1, 'review-pacemaker-capture-failure-device-system');
    advance(engine, 2, 'review-pacemaker-capture-failure-causes');
    const prompt = pacemakerCaptureFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pcf-rescue');
    expect(prompt.suggestion).toContain('Get the bridge organised now');
    expect(prompt.because).toContain('arithmetic rather than judgment');
  });

  it('holds on the open lanes when the later panel is attempted early', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-pacemaker-capture-failure-pulse-and-pattern');
    advance(engine, 1, 'activate-pacemaker-capture-failure-rescue-pathway');
    advance(engine, 2, 'review-pacemaker-capture-failure-later-panel');
    expect(snapshot(engine)!.laterPanelAtTick).toBeNull();
    expect(pacemakerCaptureFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pcf-device');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-pacemaker-capture-failure-device-system');
    expect(snapshot(engine)!.deviceSystemAtTick).toBeNull();
    expect(pacemakerCaptureFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pcf-recognition');
  });

  it('never programs a device or claims a fracture', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pacemakerCaptureFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['program the output to 5 v', 'the lead is fractured', 'replace the lead']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pacemakerCaptureFailureInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pacemakerCaptureFailureInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pacemakerCaptureFailureInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pacemakerCaptureFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pacemakerCaptureFailureInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
