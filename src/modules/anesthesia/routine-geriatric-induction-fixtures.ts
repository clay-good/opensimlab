import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the geriatric-induction lesson.
 *
 * The counterfactual is the total, and saying so honestly is the point of these
 * three paths. The expert gives 100 mg as five 20 mg increments. The recovery
 * gives the SAME 100 mg as one push. The error gives 144 mg — 2 mg/kg, the
 * textbook adult dose — also as one push.
 *
 * Measured, the expert reaches a pressure nadir of 69.2 mmHg and the
 * single-push hundred reaches 69.1. The increments are worth a tenth of a
 * millimetre of mercury. The 144 mg reaches 61.9 and fails the perfusion
 * objective outright.
 *
 * So in this bounded model the total dose is what moves the pressure, and the
 * incremental technique moves the titration objective without moving the
 * patient. A test measures exactly that, and the evidence states it rather than
 * implying the rubric and the physiology agree. The clinical argument for
 * titrating — that the effect site lags the plasma and a second increment given
 * before the first has arrived is a dose you did not mean to give — is about
 * doses this transcript never reaches, and the model is not being asked to
 * demonstrate it.
 */

const OXYGEN: LearnerAction = { tick: 60, type: 'ventilator', payload: { fio2: 1 } };
const PROPOFOL = (tick: number, mg: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount: mg, unit: 'mg' } });
/** 6.9 mL/kg on 72 kg, inside the 6-8 the objective asks for. */
const VENTILATE: LearnerAction = {
  tick: 2400, type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', tidalVolumeMl: 500 },
};

/** Five 20 mg increments, fifteen seconds apart: 100 mg, or 1.39 mg/kg. */
const increments: readonly LearnerAction[] =
  [0, 1, 2, 3, 4].map((step) => PROPOFOL(1500 + step * 150, 20));

export const ROUTINE_GERIATRIC_INDUCTION_FIXTURES = {
  scenarioId: 'routine-geriatric-induction', contentVersion: '0.1.0',
  seed: 5860, ticks: 5400,

  /** Nothing is done at all. Nothing is exercised, and he keeps breathing. */
  noAction: [] as readonly LearnerAction[],

  /** Oxygen, the labelled total in increments, then age-appropriate ventilation. */
  expert: [OXYGEN, ...increments, VENTILATE] as readonly LearnerAction[],

  /** The textbook adult dose, in one push. */
  commonError: [OXYGEN, PROPOFOL(1500, 144), VENTILATE] as readonly LearnerAction[],

  /** The right total, in one push: the dose learned and the technique not. */
  recovery: [OXYGEN, PROPOFOL(1500, 100), VENTILATE] as readonly LearnerAction[],
} as const;
