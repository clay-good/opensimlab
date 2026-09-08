/**
 * The anaesthesia module's ninth observed-state worked example, driven through
 * the real engine.
 *
 * Its preparation beat has two halves rather than one, because the objective
 * asks for a fresh-gas flow as well as an inspired fraction. And it has no beat
 * that starts the ventilator: the engine begins delivering the moment the tube
 * is placed, so one was written and cut, and this file asserts it stayed cut.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { OBSTETRIC_GENERAL_ANESTHESIA as SCENARIO } from '@anesthesia/scenarios/obstetric-general-anesthesia';
import { RAPID_SEQUENCE_INDUCTION } from '@anesthesia/scenarios/rapid-sequence-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { OBSTETRIC_GENERAL_ANESTHESIA_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/obstetric-general-anesthesia-fixtures';
import {
  OBSTETRIC_GENERAL_ANESTHESIA_DEMONSTRATION_VERSION, obstetricGeneralAnesthesiaDemonstrationStep,
  supportsObstetricGeneralAnesthesiaDemonstration, type ObstetricGeneralAnesthesiaProgress,
} from '@anesthesia/demo/obstetric-general-anesthesia-demonstration';

/** The same assembly the cockpit does, from the same sources. */
function progress(
  engine: AnesthesiaEngine, frame: ReturnType<AnesthesiaEngine['step']>,
): ObstetricGeneralAnesthesiaProgress {
  const equipment = engine.equipment();
  const state = frame.state as Readonly<Record<string, number>>;
  return {
    inspiredOxygenFraction: equipment.ventilator.fio2,
    freshGasFlowLPerMin: equipment.ventilator.freshGasFlowLPerMin ?? 0,
    endTidalOxygenFraction: state.endTidalO2Fraction ?? 0,
    trainOfFourCount: state.trainOfFourCount ?? 4,
    propofolPlasma: frame.concentrations.find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    rocuroniumPlasma: frame.concentrations.find((drug) => drug.drugId === 'rocuronium')?.plasma ?? 0,
    intubated: equipment.airway.intubated,
    ventilating: equipment.ventilator.delivering,
    spo2Percent: state.spo2Percent ?? 100,
    airwayAttempts: equipment.airway.attempts,
    airwayAttemptInProgress: equipment.airway.attemptInProgress,
  };
}

function runExample(opening: readonly LearnerAction[] = [], limit = 12_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const saturations: number[] = [];
  const events = [];
  let handed = 0;
  let frame = engine.step();
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = obstetricGeneralAnesthesiaDemonstrationStep(progress(engine, frame));
    if (step.finished) {
      return { beats, narrations, saturations, events, closing: step.narration, engine, tick };
    }
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    events.push(...frame.events);
    saturations.push((frame.state as Readonly<Record<string, number>>).spo2Percent ?? 100);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Obstetric Example Prepares Both Halves', () => {
  const fresh = runExample();
  // Handed the error path's opening: relaxant before hypnotic, on room air.
  const handover = runExample(FIXTURES.commonError.slice(0, 2));

  it('binds to this exact scenario version and no other', () => {
    expect(OBSTETRIC_GENERAL_ANESTHESIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsObstetricGeneralAnesthesiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsObstetricGeneralAnesthesiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The non-obstetric rapid sequence shares an objective id.
    expect(supportsObstetricGeneralAnesthesiaDemonstration(RAPID_SEQUENCE_INDUCTION)).toBe(false);
    expect(supportsObstetricGeneralAnesthesiaDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('advances every beat on physiology, in order, to a secured airway', () => {
    expect(fresh.beats).toEqual([
      'prepare', 'filling', 'hypnotic', 'relaxant', 'onset', 'airway', 'attempt-1',
    ]);
    expect(fresh.engine.equipment().airway.intubated).toBe(true);
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('sets both halves of the preparation in one action, and names the forgotten one', () => {
    const prepare = fresh.narrations[fresh.beats.indexOf('prepare')]!;
    expect(prepare).toContain('the half that gets forgotten');
    expect(prepare).toContain('rebreathes her own nitrogen');
    expect(fresh.engine.equipment().ventilator.freshGasFlowLPerMin).toBe(10);
    expect(fresh.engine.equipment().ventilator.fio2).toBe(1);
  });

  it('has no beat that starts the ventilator, because one is unreachable', () => {
    // The engine begins delivering the moment the tube is placed. A beat that
    // dispatched it would promise an action no viewer ever sees.
    expect(fresh.beats).not.toContain('ventilate');
    expect(fresh.engine.equipment().ventilator.delivering).toBe(true);
    // What it had to say survives in the closing narration instead.
    expect(fresh.closing).toContain('placement is a claim');
    expect(fresh.closing).toContain('never does is start the ventilator');
  });

  it('gives the hypnotic before the relaxant, and says why here especially', () => {
    expect(fresh.beats.indexOf('hypnotic')).toBeLessThan(fresh.beats.indexOf('relaxant'));
    expect(fresh.narrations[fresh.beats.indexOf('relaxant')]!)
      .toContain('only now, because she is asleep');
    expect(fresh.narrations[fresh.beats.indexOf('hypnotic')]!)
      .toContain('cannot tell you');
  });

  it('waits for the count rather than for the obstetrician', () => {
    expect(fresh.beats.indexOf('onset')).toBeLessThan(fresh.beats.indexOf('airway'));
    const onset = fresh.narrations[fresh.beats.indexOf('onset')]!;
    expect(onset).toContain('the least margin to spend on a second look');
    expect(fresh.narrations[fresh.beats.indexOf('airway')]!)
      .toContain('a proxy rather than a promise');
  });

  it('closes on the floor this lesson is scored against, and why it is lower', () => {
    expect(fresh.closing).toContain('95%');
    expect(fresh.closing).toContain('smaller functional residual capacity');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('keeps the margin the preparation bought', () => {
    expect(Math.min(...fresh.saturations)).toBeGreaterThanOrEqual(95);
  });

  it('picks up a case someone else began on room air', () => {
    // It cannot un-give the relaxant or rebuild the reserve, and it does not
    // pretend to: it takes the airway promptly and pays for the missing wash-in.
    expect(handover.beats).not.toContain('prepare');
    expect(handover.beats).not.toContain('hypnotic');
    expect(handover.engine.equipment().airway.intubated).toBe(true);
    expect(Math.min(...handover.saturations)).toBeLessThan(95);
  });

  it('never predicts an outcome for a person or a pregnancy', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'the baby',
      'no harm came', 'she survived', 'the delivery went']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = obstetricGeneralAnesthesiaDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
