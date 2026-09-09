/**
 * The anaesthesia module's thirtieth observed-state worked example, driven
 * through the real engine.
 *
 * The only one whose central instruction is to do less. Its closing gate reads
 * the artifact having CLEARED together with the latched cross-check flag —
 * neither of which can hold before the fault.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION as SCENARIO } from '@anesthesia/scenarios/capnography-sampling-line-obstruction';
import { CIRCLE_SYSTEM_REBREATHING } from '@anesthesia/scenarios/circle-system-rebreathing';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/capnography-sampling-line-obstruction-fixtures';
import {
  CAPNOGRAPHY_LINE_DEMONSTRATION_VERSION, capnographyLineDemonstrationStep,
  supportsCapnographyLineDemonstration, type CapnographyLineProgress,
} from '@anesthesia/demo/capnography-line-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 6_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, CapnographyLineProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): CapnographyLineProgress => {
    const equipment = engine.equipment();
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      samplingLineObstructed: equipment.capnographyLine?.obstructed ?? false,
      ventilationCrossChecked: equipment.capnographyLine?.ventilationCrossChecked ?? false,
      spontaneousRateBpm: state.respiratoryRateBpm ?? 0,
      spo2Percent: state.spo2Percent ?? 100,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = capnographyLineDemonstrationStep(progress());
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

describe('Requirement: The Capnography Example Does Less', () => {
  const fresh = runExample();
  // A learner who cross-checked and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(CAPNOGRAPHY_LINE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCapnographyLineDemonstration(SCENARIO)).toBe(true);
    expect(supportsCapnographyLineDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCapnographyLineDemonstration(CIRCLE_SYSTEM_REBREATHING)).toBe(false);
  });

  it('waits for the fault and does not finish before it', () => {
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.snapshots.get('watching')!.samplingLineObstructed).toBe(false);
    expect(fresh.snapshots.get('watching')!.ventilationCrossChecked).toBe(false);
    expect(fresh.beats.length).toBeGreaterThan(1);
    // Nothing is refused, because it never acts on a normal trace.
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('capnography-cross-check-refused-'))).toHaveLength(0);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['watching', 'cross-check', 'restore']);
    const recorded = fresh.progress();
    expect(recorded.ventilationCrossChecked).toBe(true);
    expect(recorded.samplingLineObstructed).toBe(false);
  });

  it('cross-checks before it restores', () => {
    expect(fresh.snapshots.get('restore')!.ventilationCrossChecked).toBe(true);
    expect(fresh.snapshots.get('cross-check')!.samplingLineObstructed).toBe(true);
    expect(fresh.beats.indexOf('cross-check')).toBeLessThan(fresh.beats.indexOf('restore'));
  });

  it('never touches the patient', () => {
    // The whole point: no airway action, no ventilator change, anywhere.
    const dispatched = fresh.beats.map((id) => capnographyLineDemonstrationStep(
      fresh.snapshots.get(id)!,
    ).dispatch?.type).filter(Boolean);
    expect(dispatched.every((type) => type === 'capnography-line')).toBe(true);
    expect(dispatched).not.toContain('laryngoscopy');
    expect(dispatched).not.toContain('ventilator');
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('restore');
    expect(handover.beats).not.toContain('watching');
    expect(handover.beats).not.toContain('cross-check');
    expect(handover.progress().samplingLineObstructed).toBe(false);
  });

  it('names the signs that do not travel down the sampling line', () => {
    const crossCheck = fresh.narrations[fresh.beats.indexOf('cross-check')]!;
    expect(crossCheck).toContain('none of which come down the sampling line');
    expect(crossCheck).toContain('a monitor fault until proven otherwise');
  });

  it('warns about the ordering before a learner could meet it', () => {
    const restore = fresh.narrations[fresh.beats.indexOf('restore')]!;
    expect(restore).toContain('clear the fault first and the cross-check is refused');
    expect(restore).toContain('gone for good');
  });

  it('declines the credit its own demonstration would take', () => {
    // The honest closing: a run doing nothing earns the objective this
    // example worked for.
    expect(fresh.closing).toContain('the apnoea that was feared is the one the learner produced');
    expect(fresh.closing).toContain('a run that does NOTHING earns this objective in full');
    expect(fresh.closing).toContain('credit rather than luck');
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
    const step = capnographyLineDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
