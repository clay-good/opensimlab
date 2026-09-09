/**
 * The anaesthesia module's thirty-seventh observed-state worked example, driven
 * through the real engine.
 *
 * Its induce beat says BY WEIGHT in as many words, because the objective scores
 * the unit rather than the milligrams and a learner would otherwise discover
 * that only by losing the mark.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { ROUTINE_PEDIATRIC_IV_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-pediatric-iv-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { ROUTINE_PEDIATRIC_IV_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/routine-pediatric-iv-induction-fixtures';
import {
  PEDIATRIC_IV_INDUCTION_DEMONSTRATION_VERSION, pediatricIvInductionDemonstrationStep,
  supportsPediatricIvInductionDemonstration, type PediatricIvInductionProgress,
} from '@anesthesia/demo/pediatric-iv-induction-demonstration';

const PROPOFOL = SCENARIO.formulary.find((entry) => entry.drugId === 'propofol')!;

function runExample(opening: readonly LearnerAction[] = [], limit = 9_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, PediatricIvInductionProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): PediatricIvInductionProgress => {
    const equipment = engine.equipment();
    const state = frame.state as Readonly<Record<string, number>>;
    const remaining = equipment.drugs
      .find((drug) => drug.drugId === 'propofol')?.syringeRemainingMl ?? PROPOFOL.syringeVolumeMl;
    return {
      endTidalOxygenFraction: state.endTidalO2Fraction ?? 0,
      propofolTotalMg: (PROPOFOL.syringeVolumeMl - remaining) * PROPOFOL.concentration,
      tidalVolumeMl: equipment.ventilator.tidalVolumeMl,
      ventilatorDelivering: equipment.ventilator.delivering,
      weightKg: SCENARIO.patient.weightKg,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = pediatricIvInductionDemonstrationStep(progress());
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

describe('Requirement: The Paediatric Example Doses By Weight', () => {
  const fresh = runExample();
  // A learner who preoxygenated on the machine's own 120 mL default, induced
  // by weight, and handed the case back with the breath still to be sized.
  const handover = runExample([
    { tick: 100, type: 'ventilator', payload: { delivering: true, fio2: 1 } },
    { tick: 1500, type: 'bolus', payload: { drugId: 'propofol', amount: 3, unit: 'mg/kg' } },
  ] as LearnerAction[]);

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_IV_INDUCTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricIvInductionDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricIvInductionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The adult counterpart, and a child of a different size.
    expect(supportsPediatricIvInductionDemonstration(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsPediatricIvInductionDemonstration({
      ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 30 },
    })).toBe(false);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['preoxygenate', 'induce', 'ventilate']);
    // The closing gate reads >= 130 mL rather than merely in-band: the
    // scenario's own 120 mL default would otherwise end the example the
    // moment the propofol landed, before the ventilate beat could run.
    expect(new Set(fresh.beats).size).toBe(fresh.beats.length);
    const recorded = fresh.progress();
    expect(recorded.propofolTotalMg).toBe(60);
    expect(recorded.tidalVolumeMl).toBe(140);
  });

  it('waits for the measured fraction rather than the dial', () => {
    // Read at the moment it induced, not at the end of the run.
    expect(fresh.snapshots.get('induce')!.endTidalOxygenFraction).toBeGreaterThanOrEqual(0.9);
    expect(fresh.snapshots.get('induce')!.propofolTotalMg).toBe(0);
    expect(fresh.narrations[fresh.beats.indexOf('preoxygenate')]!)
      .toContain('turning the dial up is not the same as having done it');
    // And it names the machine's own already-in-band default.
    expect(fresh.narrations[fresh.beats.indexOf('preoxygenate')]!)
      .toContain('already sits at 120 mL, which is 6 mL/kg');
  });

  it('gives three milligrams per kilogram, entered by weight', () => {
    // 3 mg/kg of 20 kg is the 60 mg the syringe actually loses.
    expect(fresh.progress().propofolTotalMg).toBe(3 * SCENARIO.patient.weightKg);
    const induce = fresh.narrations[fresh.beats.indexOf('induce')]!;
    expect(induce).toContain('enter it BY WEIGHT');
    expect(induce).toContain('gives the identical drug and is scored lower');
  });

  it('sizes the breath to the child and names the adult number', () => {
    const ventilate = fresh.narrations[fresh.beats.indexOf('ventilate')]!;
    expect(ventilate).toContain('7 mL/kg');
    expect(ventilate).toContain('450 mL here is 22.5 mL/kg');
    expect(fresh.progress().tidalVolumeMl / SCENARIO.patient.weightKg).toBeCloseTo(7, 1);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('ventilate');
    expect(handover.beats).not.toContain('preoxygenate');
    expect(handover.beats).not.toContain('induce');
    expect(handover.progress().propofolTotalMg).toBe(60);
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('scores the objective PARTLY MET rather than met');
    expect(fresh.closing).toContain('a weight-indexed habit rather than an arithmetic result');
    expect(fresh.closing).toContain('costs this child nothing measurable');
    expect(fresh.closing).toContain('the saturation reaches 36%');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a child', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'she did well', 'recovered fully', 'was fine',
      'no harm came', 'survived', 'the scan went', 'woke up happy']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = pediatricIvInductionDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
