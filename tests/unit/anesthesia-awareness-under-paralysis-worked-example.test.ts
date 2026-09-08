/**
 * The anaesthesia module's fourth observed-state worked example, driven through
 * the real engine.
 *
 * Its central beat is a beat that does nothing. Between securing the airway and
 * the line failing, the correct action is to keep reading two numbers that are
 * not moving, and an example that fast-forwarded through it would skip the only
 * thing this lesson teaches. The other thing worth asserting is that it treats
 * reconnecting and delivering as two separate claims.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { AWARENESS_UNDER_PARALYSIS as SCENARIO } from '@anesthesia/scenarios/awareness-under-paralysis';
import { RAPID_SEQUENCE_INDUCTION } from '@anesthesia/scenarios/rapid-sequence-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { AWARENESS_UNDER_PARALYSIS_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/awareness-under-paralysis-fixtures';
import {
  AWARENESS_UNDER_PARALYSIS_DEMONSTRATION_VERSION, awarenessUnderParalysisDemonstrationStep,
  supportsAwarenessUnderParalysisDemonstration, type AwarenessUnderParalysisProgress,
} from '@anesthesia/demo/awareness-under-paralysis-demonstration';

/** The same assembly the cockpit does, from the same sources. */
function progress(
  engine: AnesthesiaEngine, frame: ReturnType<AnesthesiaEngine['step']>,
): AwarenessUnderParalysisProgress {
  const equipment = engine.equipment();
  const state = frame.state as Readonly<Record<string, number>>;
  return {
    inspiredOxygenFraction: equipment.ventilator.fio2,
    depthIndex: state.depthIndex ?? 100,
    trainOfFourRatio: state.trainOfFourRatio ?? 1,
    hypnoticLineConnected: equipment.hypnoticLine.connected,
    hypnoticLineInspected: equipment.hypnoticLine.inspected,
    propofolInfusionRate: equipment.drugs.find((drug) => drug.drugId === 'propofol')?.infusionRate ?? 0,
    remifentanilPlasma: frame.concentrations.find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: frame.concentrations.find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    rocuroniumPlasma: frame.concentrations.find((drug) => drug.drugId === 'rocuronium')?.plasma ?? 0,
    intubated: equipment.airway.intubated,
    airwayAttempts: equipment.airway.attempts,
    airwayAttemptInProgress: equipment.airway.attemptInProgress,
  };
}

function runExample(opening: readonly LearnerAction[] = [], limit = 14_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = awarenessUnderParalysisDemonstrationStep(progress(engine, frame));
    if (step.finished) {
      return { beats, narrations, events, closing: step.narration, engine, tick };
    }
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    events.push(...frame.events);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Silent-Failure Example Reads The Delivery Path', () => {
  const fresh = runExample();
  // The error path's opening: the relaxant before the hypnotic, no maintenance
  // infusion at all, handed over with the line already disconnected.
  const handover = runExample(FIXTURES.commonError);

  it('binds to this exact scenario version and no other', () => {
    expect(AWARENESS_UNDER_PARALYSIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAwarenessUnderParalysisDemonstration(SCENARIO)).toBe(true);
    expect(supportsAwarenessUnderParalysisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The lesson that raises this harm without scoring it must not run this.
    expect(supportsAwarenessUnderParalysisDemonstration(RAPID_SEQUENCE_INDUCTION)).toBe(false);
    expect(supportsAwarenessUnderParalysisDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('advances every beat on physiology, in order, to a restored anaesthetic', () => {
    expect(fresh.beats).toEqual([
      'oxygen', 'opioid', 'hypnotic', 'infusion', 'relaxant', 'airway', 'attempt-1',
      'watching', 'inspect', 'reconnect',
    ]);
    expect(fresh.engine.equipment().hypnoticLine.connected).toBe(true);
    expect(fresh.engine.equipment().hypnoticLine.inspected).toBe(true);
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('secures the airway before it goes looking at a giving set', () => {
    // Found by driving it: the line beats originally outranked the induction, so
    // a run that reached the failure tick mid-induction abandoned an unsecured
    // airway. The airway now comes first even when the line has already failed.
    expect(fresh.beats.indexOf('airway')).toBeLessThan(fresh.beats.indexOf('inspect'));
    expect(fresh.beats.indexOf('relaxant')).toBeLessThan(fresh.beats.indexOf('airway'));
  });

  it('gives the hypnotic and its infusion before the relaxant', () => {
    expect(fresh.beats.indexOf('hypnotic')).toBeLessThan(fresh.beats.indexOf('infusion'));
    expect(fresh.beats.indexOf('infusion')).toBeLessThan(fresh.beats.indexOf('relaxant'));
    expect(fresh.narrations[fresh.beats.indexOf('relaxant')]!)
      .toContain('no way to tell you anything');
  });

  it('says the light rate is the reason the failure is visible at all', () => {
    // The finding that decides how this lesson can be run: a generous infusion
    // is safer minute to minute and hides a delivery failure for longer.
    const infusion = fresh.narrations[fresh.beats.indexOf('infusion')]!;
    expect(infusion).toContain('deliberately light');
    expect(infusion).toContain('protects her best is the one that would warn you last');
  });

  it('keeps the beat that does nothing, because it is the lesson', () => {
    const watching = fresh.narrations[fresh.beats.indexOf('watching')]!;
    expect(watching).toContain('nothing to click');
    expect(watching).toContain('removed on purpose');
    // And it names the monitor's own limit rather than borrowing its authority.
    expect(watching).toContain('drug model rather than an electroencephalogram');
  });

  it('looks along the line rather than reaching for another bolus', () => {
    const inspect = fresh.narrations[fresh.beats.indexOf('inspect')]!;
    expect(inspect).toContain('a delivery question before it is a dosing one');
    expect(inspect).toContain('the pump is the last place it will show');
    expect(fresh.narrations[fresh.beats.indexOf('reconnect')]!)
      .toContain('never stopped and never alarmed');
  });

  it('treats reconnecting and delivering as two separate claims', () => {
    // Found by driving it: a handover that reconnects a line which was never
    // feeding an infusion can never settle, because restoring the path restores
    // nothing on its own. Measured, that gesture leaves the trace unchanged.
    expect(handover.beats).toContain('restart-infusion');
    expect(handover.narrations[handover.beats.indexOf('restart-infusion')]!)
      .toContain('not the same as delivering an anaesthetic');
    expect(fresh.beats).not.toContain('restart-infusion');
    expect(handover.engine.equipment().drugs
      .find((drug) => drug.drugId === 'propofol')!.infusionRate).toBeGreaterThan(0);
  });

  it('closes on what warned and what could not', () => {
    expect(fresh.closing).toContain('none of them measures whether she was asleep');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never claims to know whether she was aware', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she was awake', 'she remembers', 'she will remember',
      'she did well', 'she recovered', 'no harm came', 'she was fine']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = awarenessUnderParalysisDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
