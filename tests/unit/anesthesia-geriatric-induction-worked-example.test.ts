/**
 * The anaesthesia module's tenth observed-state worked example, driven through
 * the real engine.
 *
 * It is the first whose central beat repeats a known number of times: five
 * increments are five separate decisions and each needs its own beat. They are
 * keyed on the accepted milligrams, derived from the engine's syringe volume
 * rather than a count of clicks, because the plasma concentration falls between
 * increments and a beat gated on it walks backwards.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { ROUTINE_GERIATRIC_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-geriatric-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { HYPOTENSION_AFTER_INDUCTION } from '@anesthesia/scenarios/hypotension-after-induction';
import { ROUTINE_GERIATRIC_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/routine-geriatric-induction-fixtures';
import {
  GERIATRIC_INDUCTION_DEMONSTRATION_VERSION, geriatricInductionDemonstrationStep,
  supportsGeriatricInductionDemonstration, type GeriatricInductionProgress,
} from '@anesthesia/demo/geriatric-induction-demonstration';

const PROPOFOL = SCENARIO.formulary.find((entry) => entry.drugId === 'propofol')!;

function runExample(opening: readonly LearnerAction[] = [], limit = 12_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): GeriatricInductionProgress => {
    const equipment = engine.equipment();
    const state = frame.state as Readonly<Record<string, number>>;
    const remaining = equipment.drugs
      .find((drug) => drug.drugId === 'propofol')?.syringeRemainingMl ?? PROPOFOL.syringeVolumeMl;
    return {
      inspiredOxygenFraction: equipment.ventilator.fio2,
      endTidalOxygenFraction: state.endTidalO2Fraction ?? 0,
      propofolTotalMg: (PROPOFOL.syringeVolumeMl - remaining) * PROPOFOL.concentration,
      propofolPlasma: frame.concentrations.find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
      depthIndex: state.depthIndex ?? 100,
      meanArterialMmHg: state.meanArterialMmHg ?? 0,
      ventilating: equipment.ventilator.delivering,
      spo2Percent: state.spo2Percent ?? 100,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = geriatricInductionDemonstrationStep(progress());
    if (step.finished) {
      return { beats, narrations, events, closing: step.narration, engine, progress, tick };
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

describe('Requirement: The Geriatric Example Counts Milligrams, Not Clicks', () => {
  const fresh = runExample();
  // A learner who has already given two increments and hands the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 3));

  it('binds to this exact scenario version and no other', () => {
    expect(GERIATRIC_INDUCTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsGeriatricInductionDemonstration(SCENARIO)).toBe(true);
    expect(supportsGeriatricInductionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The younger counterpart, and the other lesson about a falling pressure.
    expect(supportsGeriatricInductionDemonstration(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsGeriatricInductionDemonstration(HYPOTENSION_AFTER_INDUCTION)).toBe(false);
  });

  it('advances every beat on physiology, in order, through five increments', () => {
    expect(fresh.beats).toEqual([
      'oxygen', 'filling',
      'increment-0', 'increment-1', 'increment-2', 'increment-3', 'increment-4',
      'ventilate',
    ]);
    expect(fresh.progress().propofolTotalMg).toBe(100);
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('keys the repeating beat on accepted milligrams rather than clicks', () => {
    // Handed a case where two increments are already in, it resumes at the third
    // rather than starting over — which a click count could not do.
    expect(handover.beats[0]).toBe('increment-2');
    expect(handover.beats).not.toContain('increment-0');
    expect(handover.progress().propofolTotalMg).toBe(100);
  });

  it('names the range and why it is lower, on the first increment', () => {
    const first = fresh.narrations[fresh.beats.indexOf('increment-0')]!;
    expect(first).toContain('1 to 1.5 mg/kg');
    expect(first).toContain('smaller, slower circulation');
  });

  it('treats stopping as the decision on the last increment', () => {
    const last = fresh.narrations[fresh.beats.indexOf('increment-4')]!;
    expect(last).toContain('1.39 mg/kg');
    expect(last).toContain('no reason to spend the rest');
  });

  it('scales the tidal volume to the patient rather than the machine', () => {
    const ventilate = fresh.narrations[fresh.beats.indexOf('ventilate')]!;
    expect(ventilate).toContain('6.9 mL/kg');
    expect(ventilate).toContain('set before anyone met him');
    expect(fresh.engine.equipment().ventilator.tidalVolumeMl).toBe(500);
  });

  it('declines the credit its own demonstration would take', () => {
    // The honest closing. In this model the total moves the pressure and the
    // increments move the objective, and the example says so rather than
    // implying the five clicks earned the number on the screen.
    expect(fresh.closing).toContain('within a tenth of a millimetre of mercury');
    expect(fresh.closing).toContain('the titration objective, not the patient');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'he recovered', 'he was fine', 'the operation went',
      'no harm came', 'he survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = geriatricInductionDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
