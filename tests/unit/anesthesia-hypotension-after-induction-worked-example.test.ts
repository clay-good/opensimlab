/**
 * The anaesthesia module's second observed-state worked example, driven through
 * the real engine.
 *
 * What is new here is a beat that repeats. Volume in this patient is not one
 * decision, it is a decision taken again every time the pressure sags, so the
 * thing worth asserting is that the count is produced by the pressure rather
 * than written down — and that the example stops, both when the losses end and
 * when four litres have not answered the question.
 *
 * It is also driven twice: once from a fresh start, and once from the error
 * path's opening, because an example that reads the patient rather than a script
 * has to be able to pick up a case someone else began.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { HYPOTENSION_AFTER_INDUCTION as SCENARIO } from '@anesthesia/scenarios/hypotension-after-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RAPID_DESATURATION } from '@anesthesia/scenarios/rapid-desaturation';
import { HYPOTENSION_AFTER_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/hypotension-after-induction-fixtures';
import {
  HYPOTENSION_AFTER_INDUCTION_DEMONSTRATION_VERSION, hypotensionAfterInductionDemonstrationStep,
  supportsHypotensionAfterInductionDemonstration, type HypotensionAfterInductionProgress,
} from '@anesthesia/demo/hypotension-after-induction-demonstration';

/** The same assembly the cockpit does, from the same sources. */
function progress(
  engine: AnesthesiaEngine, frame: ReturnType<AnesthesiaEngine['step']>,
): HypotensionAfterInductionProgress {
  const equipment = engine.equipment();
  const state = frame.state as Readonly<Record<string, number>>;
  return {
    inspiredOxygenFraction: equipment.ventilator.fio2,
    endTidalOxygenFraction: state.endTidalO2Fraction ?? 0,
    meanArterialMmHg: state.meanArterialMmHg ?? 0,
    crystalloidTotalMl: equipment.resuscitation.crystalloidTotalMl,
    lossesRunning: equipment.resuscitation.hemorrhageActive === true,
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
  const pressures: number[] = [];
  const saturations: number[] = [];
  let handed = 0;
  let frame = engine.step();
  for (let tick = 1; tick <= limit; tick += 1) {
    // The learner's own opening, replayed first. The example is handed the
    // controls once it has run out.
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) {
      frame = engine.step();
      continue;
    }
    const step = hypotensionAfterInductionDemonstrationStep(progress(engine, frame));
    if (step.finished) {
      return { beats, narrations, pressures, saturations, closing: step.narration, engine, tick };
    }
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    const state = frame.state as Readonly<Record<string, number>>;
    pressures.push(state.meanArterialMmHg ?? 0);
    saturations.push(state.spo2Percent ?? 100);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Pressure Example Reads The Pressure', () => {
  const fresh = runExample();
  // The error path's opening, minus its vasopressors: a full 2 mg/kg induction
  // and an airway, handed over with the pressure already falling.
  const handover = runExample([
    { tick: 120, type: 'ventilator', payload: { fio2: 1 } },
    { tick: 600, type: 'bolus', payload: { drugId: 'remifentanil', amount: 25, unit: 'µg' } },
    { tick: 650, type: 'bolus', payload: { drugId: 'propofol', amount: 108, unit: 'mg' } },
    { tick: 1300, type: 'laryngoscopy', payload: { technique: 'video' } },
    { tick: 2000, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } },
  ]);

  it('binds to this exact scenario version and no other', () => {
    expect(HYPOTENSION_AFTER_INDUCTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHypotensionAfterInductionDemonstration(SCENARIO)).toBe(true);
    expect(supportsHypotensionAfterInductionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // Neither of the two anaesthesia lessons that came before it runs this.
    expect(supportsHypotensionAfterInductionDemonstration(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsHypotensionAfterInductionDemonstration(RAPID_DESATURATION)).toBe(false);
  });

  it('advances every beat on physiology, in order, to a secured airway', () => {
    expect(fresh.beats).toEqual([
      'oxygen', 'preload', 'filling', 'opioid', 'hypnotic', 'airway', 'attempt-1',
      'holding-1000', 'replace-1000', 'holding-2000', 'replace-2000', 'holding-3000',
      'replace-3000', 'holding-4000',
    ]);
    expect(fresh.engine.equipment().airway.intubated).toBe(true);
    // Nothing in the example turns the ventilator on: the engine starts
    // delivering when the tube is placed.
    expect(fresh.beats).not.toContain('ventilate');
  });

  it('gives the litre before the induction rather than in answer to a fall', () => {
    // The order is the lesson. The preload beat comes before the opioid, and it
    // has to justify itself against a monitor that shows a normal pressure.
    expect(fresh.beats.indexOf('preload')).toBeLessThan(fresh.beats.indexOf('opioid'));
    const preload = fresh.narrations[fresh.beats.indexOf('preload')]!;
    expect(preload).toContain('before the induction rather than after it');
    expect(preload).toContain('compensated picture');
  });

  it('repeats the replacement beat as often as the pressure asks, not on a count', () => {
    // Each repeat carries the engine's accepted total in its own id, so the
    // number of them is produced by the run rather than written into the file.
    const replacements = fresh.beats.filter((id) => id.startsWith('replace-'));
    expect(replacements).toEqual(['replace-1000', 'replace-2000', 'replace-3000']);
    expect(fresh.engine.equipment().resuscitation.crystalloidTotalMl).toBe(4000);
    // And it alternates with a beat that gives nothing, because the pressure
    // comes back up between them and there is nothing to do while it holds.
    expect(fresh.beats.filter((id) => id.startsWith('holding-'))).toHaveLength(4);
  });

  it('never reaches for the vasopressor, and says so rather than leaving it unsaid', () => {
    expect(fresh.beats.some((id) => id.includes('vasopressor') || id === 'bridge')).toBe(false);
    expect(fresh.closing).toContain('never once reached for the vasopressor');
    expect(fresh.closing).toContain('given it back every time');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('keeps the pressure above the threshold the objective is scored on', () => {
    expect(Math.min(...fresh.pressures)).toBeGreaterThanOrEqual(65);
    expect(Math.min(...fresh.saturations)).toBeGreaterThan(92);
  });

  it('picks up a case someone else began, and reaches the same place', () => {
    // Handed a full-dose induction with the pressure already falling, it starts
    // at the replacement beat rather than at the beginning, because it reads the
    // accepted crystalloid total rather than a list of its own dispatches.
    expect(handover.beats[0]).toBe('replace-0');
    expect(handover.beats).not.toContain('preload');
    expect(handover.engine.equipment().resuscitation.crystalloidTotalMl).toBe(4000);
  });

  it('stops giving at four litres and names why', () => {
    // The handover run gets there, because the dose it inherited cannot be
    // undone by volume. Saying so is the lesson rather than a limit of the model.
    expect(handover.beats).toContain('ceiling');
    const ceiling = handover.narrations[handover.beats.indexOf('ceiling')]!;
    expect(ceiling).toContain('stops reaching for the bag');
    expect(ceiling).toContain('asking a different question');
    expect(fresh.beats).not.toContain('ceiling');
  });

  it('gives the age-and-illness dose and says the preset will offer otherwise', () => {
    const hypnotic = fresh.narrations[fresh.beats.indexOf('hypnotic')]!;
    expect(hypnotic).toContain('0.74 mg/kg');
    expect(hypnotic).toContain('would give 108');
    expect(hypnotic).toContain('offer you the preset anyway');
  });

  it('names what the cockpit does not model rather than implying it is absent', () => {
    const airway = fresh.narrations[fresh.beats.indexOf('airway')]!;
    expect(airway).toContain('does not model cricoid pressure');
    expect(airway).toContain('as read rather than as absent');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'the operation went',
      'no harm came', 'she survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = hypotensionAfterInductionDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
