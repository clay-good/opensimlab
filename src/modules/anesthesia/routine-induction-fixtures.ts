import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the routine-induction lesson.
 *
 * These are whole actions rather than control ids, because this lesson has no
 * lesson-specific control: it drives the flowmeter, the two syringes, the
 * laryngoscope and the ventilator that every anaesthesia lesson uses.
 *
 * The counterfactual is the clock. This scenario's `preoxygenate` objective says
 * "End-tidal, not inspired: the inspired fraction says what the machine
 * delivered, not whether the lungs filled", and in this patient the end-tidal
 * fraction does not reach 0.9 until about 97 seconds after the flowmeter moves.
 * So an induction three minutes after turning the oxygen up — which is what
 * anyone counting the wrong clock does — arrives with roughly 150 seconds of
 * reserve against an objective that asks for 180.
 *
 * The error and the recovery share that opening exactly, and differ in one
 * decision: whether a second propofol dose is given while the first is still
 * climbing to its effect site. That single difference moves the hysteresis
 * objective from failed to met and takes six millimetres of mercury off the
 * pressure nadir. The preoxygenation deficit is identical in both, and neither
 * recovers it, because seconds already spent cannot be recovered — which is the
 * lesson the objective exists to teach.
 */

const OXYGEN: LearnerAction = { tick: 120, type: 'ventilator', payload: { fio2: 1 } };
const LARYNGOSCOPY = (tick: number): LearnerAction =>
  ({ tick, type: 'laryngoscopy', payload: { technique: 'video' } });
const VENTILATE = (tick: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });
const REMIFENTANIL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'remifentanil', amount: 50, unit: 'µg' } });
const PROPOFOL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount: 2, unit: 'mg/kg' } });

export const ROUTINE_INDUCTION_FIXTURES = {
  scenarioId: 'routine-induction', contentVersion: '0.1.0', seed: 4207, ticks: 5400,

  /** Nothing is done at all. The surgeon still cuts. */
  noAction: [] as readonly LearnerAction[],

  /**
   * Oxygen, then a wait measured on the end-tidal clock, then the opioid before
   * the hypnotic, then the airway. Five actions, and no vasopressor: measured,
   * one changes the pressure nadir by less than a tenth of a millimetre of
   * mercury here, and a reference transcript should not contain an action that
   * does nothing.
   */
  expert: [
    OXYGEN,
    REMIFENTANIL(2300),
    PROPOFOL(2350),
    LARYNGOSCOPY(3400),
    VENTILATE(3500),
  ] as readonly LearnerAction[],

  /** The flowmeter clock, and then the syringe chased. */
  commonError: [
    OXYGEN,
    REMIFENTANIL(1920),
    PROPOFOL(1950),
    // Six seconds later, against a hundred-second time to peak: the pressure has
    // not finished answering the first dose and a second is already in.
    { tick: 2010, type: 'bolus', payload: { drugId: 'propofol', amount: 50, unit: 'mg' } },
    LARYNGOSCOPY(3000),
    VENTILATE(3100),
  ] as readonly LearnerAction[],

  /** The same opening mistake, and then the one decision the error path got wrong. */
  recovery: [
    OXYGEN,
    REMIFENTANIL(1920),
    PROPOFOL(1950),
    LARYNGOSCOPY(3000),
    VENTILATE(3100),
  ] as readonly LearnerAction[],
} as const;
