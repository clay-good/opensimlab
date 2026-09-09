/**
 * The anaesthesia module's thirty-second observed-state worked example, driven
 * through the real engine.
 *
 * Its closing gate requires both corrections AND the latched waveform
 * assessment, because a cleared artifact is also the state before the fault
 * arrives — the trap the two lessons bound before it document.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT as SCENARIO } from '@anesthesia/scenarios/arterial-pressure-transducer-artifact';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION } from '@anesthesia/scenarios/capnography-sampling-line-obstruction';
import { ARTERIAL_PRESSURE_TRANSDUCER_ARTIFACT_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/arterial-pressure-transducer-artifact-fixtures';
import {
  ARTERIAL_TRANSDUCER_DEMONSTRATION_VERSION, arterialTransducerDemonstrationStep,
  supportsArterialTransducerDemonstration, type ArterialTransducerProgress,
} from '@anesthesia/demo/arterial-transducer-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 8_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, ArterialTransducerProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): ArterialTransducerProgress => {
    const line = engine.equipment().arterialLine;
    return {
      mislevelingCm: line?.mislevelingCm ?? 0,
      dynamicResponse: line?.dynamicResponse ?? 'normal',
      waveformAssessed: line?.waveformAssessed ?? false,
      leveledAndZeroed: line?.leveledAndZeroed ?? false,
      cuffStatus: line?.cuff?.status ?? 'idle',
      cuffMeanArterialMmHg: line?.cuff?.meanArterialMmHg ?? null,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = arterialTransducerDemonstrationStep(progress());
    if (step.finished) {
      return { beats, narrations, events, snapshots, closing: step.narration, engine, progress, tick };
    }
    if (beats.at(-1) !== step.id) {
      beats.push(step.id); narrations.push(step.narration);
      if (!snapshots.has(step.id)) snapshots.set(step.id, progress());
    }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    events.push(...frame.events);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Transducer Example Verifies Before It Treats', () => {
  const fresh = runExample();
  // A learner who cycled the cuff and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(ARTERIAL_TRANSDUCER_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsArterialTransducerDemonstration(SCENARIO)).toBe(true);
    expect(supportsArterialTransducerDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsArterialTransducerDemonstration(CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION)).toBe(false);
  });

  it('waits for the artifacts and does not finish before them', () => {
    // The cleared state is also the pre-fault state, hence the latched flag.
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.snapshots.get('watching')!.mislevelingCm).toBe(0);
    expect(fresh.snapshots.get('watching')!.dynamicResponse).toBe('normal');
    expect(fresh.snapshots.get('watching')!.waveformAssessed).toBe(false);
    expect(fresh.beats.length).toBeGreaterThan(1);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['watching', 'verify', 'cycling', 'level', 'assess', 'restore']);
    const recorded = fresh.progress();
    expect(recorded.mislevelingCm).toBe(0);
    expect(recorded.dynamicResponse).toBe('normal');
    expect(recorded.waveformAssessed).toBe(true);
    expect(recorded.leveledAndZeroed).toBe(true);
  });

  it('cycles the cuff before it touches anything', () => {
    expect(fresh.beats.indexOf('verify')).toBeLessThan(fresh.beats.indexOf('level'));
    expect(fresh.snapshots.get('verify')!.leveledAndZeroed).toBe(false);
    // And it never gives a fluid or a drug at all.
    const dispatched = fresh.beats.map((id) => arterialTransducerDemonstrationStep(
      fresh.snapshots.get(id)!,
    ).dispatch?.type).filter(Boolean);
    expect(dispatched.every((type) => type === 'arterial-line')).toBe(true);
  });

  it('holds while the cuff inflates rather than re-requesting it', () => {
    // Without this beat the example re-dispatches a cycle already in progress.
    expect(fresh.beats.indexOf('cycling')).toBe(fresh.beats.indexOf('verify') + 1);
    expect(fresh.beats.filter((beat) => beat === 'verify')).toHaveLength(1);
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('nibp-cycle-refused-'))).toHaveLength(0);
  });

  it('assesses the waveform before correcting the damping', () => {
    expect(fresh.beats.indexOf('assess')).toBeLessThan(fresh.beats.indexOf('restore'));
    expect(fresh.snapshots.get('restore')!.waveformAssessed).toBe(true);
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('arterial-response-restoration-refused-'))).toHaveLength(0);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats).not.toContain('watching');
    // It resumes inside the cuff cycle the learner started, not by restarting it.
    expect(handover.beats[0]).toBe('cycling');
    expect(handover.beats).not.toContain('verify');
    expect(handover.progress().dynamicResponse).toBe('normal');
  });

  it('states the ordering requirement before a learner could breach it', () => {
    const verify = fresh.narrations[fresh.beats.indexOf('verify')]!;
    expect(verify).toContain('is a measurement problem until an independent measurement says otherwise');
    expect(verify).toContain('treat first and the mark is lost');
  });

  it('names the offset as arithmetic rather than physiology', () => {
    const level = fresh.narrations[fresh.beats.indexOf('level')]!;
    expect(level).toContain('subtracts about 15 mmHg');
    expect(level).toContain('was arithmetic, not physiology');
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('was 78 mmHg for this entire case');
    expect(fresh.closing).toContain('a 20 cm column of water and nothing else');
    expect(fresh.closing).toContain('it loses it for cuffing AFTER the fluid');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'she did well', 'recovered fully', 'was fine',
      'no harm came', 'survived', 'the operation went']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = arterialTransducerDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
