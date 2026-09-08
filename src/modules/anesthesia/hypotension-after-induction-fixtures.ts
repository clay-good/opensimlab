import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the hypotension-after-induction lesson.
 *
 * The counterfactual is the mechanism. A vasopressor and a bag of crystalloid
 * both raise a low pressure on the monitor, and in a vasodilated patient either
 * one will do. This patient is not vasodilated. She arrived 15% down on
 * circulating volume from two days of vomiting, the modelled losses keep running
 * for six minutes after the start, and an ACE inhibitor taken this morning has
 * left her defending the pressure poorly. So the vasopressor raises the number
 * and then gives it back, every time.
 *
 * The error path is the one that treats the number: a textbook 2 mg/kg
 * induction, no fluid at all, and four vasopressor doses chasing the pressure
 * back up. Measured through the solver the mean arterial pressure spends 658
 * seconds below 65 mmHg and reaches 28.6.
 *
 * The recovery path reads the mechanism instead, and it is deliberately
 * generous: it gives 4,500 mL of crystalloid, 500 mL MORE than the expert path,
 * and starts within a minute of the pressure falling. It halves the exposure —
 * 279 seconds, nadir 48.1 — and the objective still fails. That is the honest
 * result and it is the lesson: volume is the right treatment and it cannot undo
 * a dose that was wrong before it was given.
 */

const OXYGEN: LearnerAction = { tick: 120, type: 'ventilator', payload: { fio2: 1 } };
const FLUID = (tick: number, volumeMl: number): LearnerAction =>
  ({ tick, type: 'fluid', payload: { fluidId: 'balanced-crystalloid', volumeMl } });
const VASOPRESSOR = (tick: number, effect: number): LearnerAction =>
  ({ tick, type: 'vasopressor', payload: { effect } });
const REMIFENTANIL = (tick: number, amount: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'remifentanil', amount, unit: 'µg' } });
const PROPOFOL = (tick: number, amount: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount, unit: 'mg' } });
const LARYNGOSCOPY = (tick: number): LearnerAction =>
  ({ tick, type: 'laryngoscopy', payload: { technique: 'video' } });
const VENTILATE = (tick: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });

export const HYPOTENSION_AFTER_INDUCTION_FIXTURES = {
  scenarioId: 'hypotension-after-induction', contentVersion: '0.1.0', seed: 7714, ticks: 7800,

  /** Nothing is done at all. The surgeon still cuts, and the losses still run. */
  noAction: [] as readonly LearnerAction[],

  /**
   * Volume before the induction rather than after it, then a third of the
   * textbook propofol dose, then volume again against the losses as they run.
   *
   * The 40 mg is 0.74 mg/kg. The formulary offers a preset labelled 2 mg/kg that
   * would give 108, and the scenario's own comment says it is there to be
   * resisted. The single vasopressor dose is a bridge and is treated as one: it
   * is given once while the second litre is still going in, and never repeated.
   */
  expert: [
    OXYGEN,
    FLUID(200, 1000),
    FLUID(1500, 1000),
    REMIFENTANIL(1900, 10),
    PROPOFOL(1950, 40),
    VASOPRESSOR(2100, 0.4),
    LARYNGOSCOPY(2400),
    VENTILATE(2500),
    FLUID(2700, 1000),
    FLUID(3900, 500),
    FLUID(4800, 500),
  ] as readonly LearnerAction[],

  /** The textbook adult's induction, and then the pressure treated as a number. */
  commonError: [
    OXYGEN,
    REMIFENTANIL(600, 25),
    // 108 mg is the 2 mg/kg preset. Sixty ticks later, against a hundred-second
    // time to peak, a second dose is already in.
    PROPOFOL(650, 108),
    PROPOFOL(710, 40),
    LARYNGOSCOPY(1300),
    VENTILATE(1400),
    VASOPRESSOR(1800, 0.5),
    VASOPRESSOR(2600, 0.5),
    VASOPRESSOR(3400, 0.5),
    VASOPRESSOR(4200, 0.5),
  ] as readonly LearnerAction[],

  /** The same dose, and then the mechanism read correctly and treated fast. */
  recovery: [
    OXYGEN,
    REMIFENTANIL(600, 25),
    PROPOFOL(650, 108),
    VASOPRESSOR(1000, 0.4),
    FLUID(1100, 1000),
    LARYNGOSCOPY(1300),
    VENTILATE(1400),
    FLUID(1800, 1000),
    FLUID(2700, 1000),
    FLUID(3600, 1000),
    FLUID(4500, 500),
  ] as readonly LearnerAction[],
} as const;
