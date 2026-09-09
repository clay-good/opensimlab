/**
 * The anaesthesia module's twenty-ninth observed-state worked example, driven
 * through the real engine.
 *
 * Its closing gate reads the latched `absorbentReplaced` flag rather than the
 * inspired carbon dioxide, because that value is ALSO zero before the failure —
 * the same trap the post-extubation lesson documents.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { CIRCLE_SYSTEM_REBREATHING as SCENARIO } from '@anesthesia/scenarios/circle-system-rebreathing';
import { CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION } from '@anesthesia/scenarios/capnography-sampling-line-obstruction';
import { CIRCLE_SYSTEM_REBREATHING_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/circle-system-rebreathing-fixtures';
import {
  CIRCLE_SYSTEM_REBREATHING_DEMONSTRATION_VERSION,
  circleSystemRebreathingDemonstrationStep,
  supportsCircleSystemRebreathingDemonstration,
  type CircleSystemRebreathingProgress,
} from '@anesthesia/demo/circle-system-rebreathing-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 9_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, CircleSystemRebreathingProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): CircleSystemRebreathingProgress => {
    const equipment = engine.equipment();
    const circuit = equipment.breathingCircuit;
    return {
      absorbentExhausted: circuit?.co2Absorbent === 'exhausted',
      inspiredCo2MmHg: circuit?.inspiredCo2MmHg ?? 0,
      capnogramAssessed: circuit?.capnogramAssessed ?? false,
      absorbentReplaced: circuit?.absorbentReplaced ?? false,
      freshGasFlowLPerMin: equipment.ventilator.freshGasFlowLPerMin ?? 0,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = circleSystemRebreathingDemonstrationStep(progress());
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

describe('Requirement: The Circuit Example Bridges Before It Repairs', () => {
  const fresh = runExample();
  // A learner who assessed the capnogram and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(CIRCLE_SYSTEM_REBREATHING_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCircleSystemRebreathingDemonstration(SCENARIO)).toBe(true);
    expect(supportsCircleSystemRebreathingDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCircleSystemRebreathingDemonstration(CAPNOGRAPHY_SAMPLING_LINE_OBSTRUCTION)).toBe(false);
  });

  it('waits for the absorbent to fail before acting', () => {
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.narrations[0]).toContain('refused until the absorbent actually fails');
    // Nothing is refused, because it never acts early.
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('circuit-assessment-refused-'))).toHaveLength(0);
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('circuit-absorbent-replacement-refused-'))).toHaveLength(0);
  });

  it('does not finish before the failure, despite a zero inspired baseline', () => {
    // The trap: inspiredCo2MmHg is zero BEFORE the failure too, so the closing
    // gate reads the latched replacement flag instead.
    expect(fresh.snapshots.get('watching')!.inspiredCo2MmHg).toBe(0);
    expect(fresh.snapshots.get('watching')!.absorbentReplaced).toBe(false);
    expect(fresh.beats.length).toBeGreaterThan(1);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['watching', 'assess', 'bridge', 'replace']);
    const recorded = fresh.progress();
    expect(recorded.capnogramAssessed).toBe(true);
    expect(recorded.absorbentReplaced).toBe(true);
    expect(recorded.freshGasFlowLPerMin).toBeGreaterThanOrEqual(10);
  });

  it('raises the flow before it changes the absorbent', () => {
    // The ordering is the objective, read from the snapshots.
    expect(fresh.snapshots.get('replace')!.freshGasFlowLPerMin).toBeGreaterThanOrEqual(10);
    expect(fresh.snapshots.get('bridge')!.absorbentReplaced).toBe(false);
    expect(fresh.beats.indexOf('bridge')).toBeLessThan(fresh.beats.indexOf('replace'));
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('bridge');
    expect(handover.beats).not.toContain('watching');
    expect(handover.beats).not.toContain('assess');
    expect(handover.progress().absorbentReplaced).toBe(true);
  });

  it('calls the bridge a bridge before the learner watches it fall short', () => {
    const bridge = fresh.narrations[fresh.beats.indexOf('bridge')]!;
    expect(bridge).toContain('This is a bridge and not a treatment');
    expect(bridge).toContain('only if it comes BEFORE the definitive correction');
  });

  it('names the inspiratory baseline as the finding', () => {
    const assess = fresh.narrations[fresh.beats.indexOf('assess')]!;
    expect(assess).toContain('no longer returns to zero between breaths');
    expect(assess).toContain('breathing back what they exhaled');
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('holds an inspired carbon dioxide of 2.86 mmHg');
    expect(fresh.closing).toContain('the bridge buys nothing once the repair is coming quickly');
    expect(fresh.closing).toContain('the habit is what protects a patient when the repair turns out to be slow');
    expect(fresh.closing).toContain('reads 100% on every path here including the untreated one');
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
    const step = circleSystemRebreathingDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
