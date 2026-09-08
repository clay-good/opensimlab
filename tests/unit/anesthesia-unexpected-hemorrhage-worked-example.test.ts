/**
 * The anaesthesia module's seventh observed-state worked example, driven through
 * the real engine.
 *
 * Two of its properties were found by driving it rather than by design, and both
 * are asserted here. The engine's hemorrhage flag is true from tick 300 because
 * of the slow loss as well as the tamponade release, so reading it as "the
 * abdomen is open" sends the example straight past the induction. And it carries
 * no vasopressor beat, because a beat gated on a decaying effect re-fires
 * forever and every reordering that closes that loop makes it unreachable.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE as SCENARIO } from '@anesthesia/scenarios/unexpected-intraoperative-hemorrhage';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { HYPOTENSION_AFTER_INDUCTION } from '@anesthesia/scenarios/hypotension-after-induction';
import { UNEXPECTED_HEMORRHAGE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/unexpected-intraoperative-hemorrhage-fixtures';
import {
  UNEXPECTED_HEMORRHAGE_DEMONSTRATION_VERSION, unexpectedHemorrhageDemonstrationStep,
  supportsUnexpectedHemorrhageDemonstration, type UnexpectedHemorrhageProgress,
} from '@anesthesia/demo/unexpected-hemorrhage-demonstration';

/** The same assembly the cockpit does, from the same sources. */
function progress(
  engine: AnesthesiaEngine, frame: ReturnType<AnesthesiaEngine['step']>,
): UnexpectedHemorrhageProgress {
  const equipment = engine.equipment();
  const state = frame.state as Readonly<Record<string, number>>;
  return {
    inspiredOxygenFraction: equipment.ventilator.fio2,
    endTidalOxygenFraction: state.endTidalO2Fraction ?? 0,
    hemorrhageActive: equipment.resuscitation.hemorrhageActive === true,
    crystalloidTotalMl: equipment.resuscitation.crystalloidTotalMl,
    bloodProductsReleased: equipment.resuscitation.bloodProductsReleased === true,
    packedRedBloodCellUnits: equipment.resuscitation.packedRedBloodCellUnits ?? 0,
    meanArterialMmHg: state.meanArterialMmHg ?? 0,
    remifentanilPlasma: frame.concentrations.find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: frame.concentrations.find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    intubated: equipment.airway.intubated,
    airwayAttempts: equipment.airway.attempts,
    airwayAttemptInProgress: equipment.airway.attemptInProgress,
  };
}

function runExample(opening: readonly LearnerAction[] = [], limit = 12_000) {
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
    const step = unexpectedHemorrhageDemonstrationStep(progress(engine, frame));
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

describe('Requirement: The Haemorrhage Example Secures The Airway Before The Bleeding', () => {
  const fresh = runExample();
  // The error path's opening: a full induction dose and no fluid, handed over
  // while the slow loss is already running.
  const handover = runExample(FIXTURES.commonError.slice(0, 5));

  it('binds to this exact scenario version and no other', () => {
    expect(UNEXPECTED_HEMORRHAGE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsUnexpectedHemorrhageDemonstration(SCENARIO)).toBe(true);
    expect(supportsUnexpectedHemorrhageDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The other lesson about a pressure that falls for a volume reason.
    expect(supportsUnexpectedHemorrhageDemonstration(HYPOTENSION_AFTER_INDUCTION)).toBe(false);
    expect(supportsUnexpectedHemorrhageDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('advances every beat on physiology, in order, to released red cells', () => {
    expect(fresh.beats).toEqual([
      'oxygen', 'filling', 'opioid', 'hypnotic', 'airway', 'attempt-1',
      'preload', 'waiting-1', 'volume', 'blood-bank', 'transfuse',
    ]);
    expect(fresh.engine.equipment().resuscitation.packedRedBloodCellUnits).toBe(2);
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('secures the airway before it responds to bleeding that is already running', () => {
    // The engine's hemorrhage flag is true from tick 300 because of the slow
    // loss, so reading it as "the abdomen is open" sent the example straight
    // past the induction the first time this was written.
    expect(fresh.beats.indexOf('hypnotic')).toBeLessThan(fresh.beats.indexOf('preload'));
    expect(fresh.beats.indexOf('airway')).toBeLessThan(fresh.beats.indexOf('volume'));
    expect(fresh.beats.indexOf('preload')).toBeLessThan(fresh.beats.indexOf('volume'));
  });

  it('names the syringe as the most consequential click in the case', () => {
    const hypnotic = fresh.narrations[fresh.beats.indexOf('hypnotic')]!;
    expect(hypnotic).toContain('0.5 mg/kg');
    expect(hypnotic).toContain('the single most consequential click');
    expect(hypnotic).toContain('at exactly the same tick');
  });

  it('gives the litre before anything has gone wrong, and says why', () => {
    const preload = fresh.narrations[fresh.beats.indexOf('preload')]!;
    expect(preload).toContain('before anything has gone wrong');
    expect(preload).toContain('compensated picture');
  });

  it('carries no vasopressor beat, and explains the absence', () => {
    // A beat gated on the engine's vasopressor effect re-fires forever: the
    // effect decays below any sane threshold in about ten seconds while the
    // pressure is still down. The reference transcripts carry the dose instead.
    expect(fresh.beats.some((id) => id.includes('bridge') || id.includes('vasopressor'))).toBe(false);
    expect(fresh.closing).toContain('a bridge across a gap rather than an answer to one');
  });

  it('asks for blood while the crystalloid is running, not after it', () => {
    expect(fresh.beats.indexOf('volume')).toBeLessThan(fresh.beats.indexOf('blood-bank'));
    expect(fresh.beats.indexOf('blood-bank')).toBeLessThan(fresh.beats.indexOf('transfuse'));
    const bank = fresh.narrations[fresh.beats.indexOf('blood-bank')]!;
    expect(bank).toContain('not after it');
    // And it declines to claim the model simulates the delay it names.
    expect(bank).toContain('treat the delay as read rather than as absent');
  });

  it('refuses to call a crystalloid pressure a result', () => {
    expect(fresh.closing).toContain('Be careful what you call that');
    expect(fresh.closing).toContain('rather than an oxygen-carrying circulation');
    // And the transfuse beat is where the distinction is actually made.
    expect(fresh.narrations[fresh.beats.indexOf('transfuse')]!).toContain('carries no oxygen');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('picks up a case someone else began with the wrong dose', () => {
    expect(handover.beats).not.toContain('hypnotic');
    expect(handover.beats).toContain('preload');
    expect(handover.beats).toContain('transfuse');
    expect(handover.engine.equipment().resuscitation.packedRedBloodCellUnits).toBe(2);
    expect(handover.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'the operation went',
      'no harm came', 'she survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = unexpectedHemorrhageDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
