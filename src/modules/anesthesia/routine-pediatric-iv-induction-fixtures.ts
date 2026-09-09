import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the paediatric IV-induction lesson.
 *
 * A healthy six-year-old of 20 kg. The labelled propofol range is 2.5-3.5 mg/kg,
 * which is 50-70 mg here, and the tidal-volume range is 6-8 mL/kg, which is
 * 120-160 mL.
 *
 * The error path is an adult reflex applied to a child: everything correct
 * except a 450 mL tidal volume, which is 22.5 mL/kg. It costs the ventilation
 * objective and costs the patient nothing measurable -- the saturation holds at
 * 100% throughout, as it does on every path in this file except the one that
 * stops ventilating altogether.
 *
 * The recovery path corrects the tidal volume at tick 2,400, in time for the
 * sustained end-tidal window the objective reads, and meets all four.
 */

const VENTILATE = (tick: number, tidalVolumeMl: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: {
    delivering: true, mode: 'volume-control', fio2: 1,
    tidalVolumeMl, respiratoryRateBpm: 18,
  },
});
/** Entered by weight, which is the half of this the objective is about. */
const PROPOFOL_BY_WEIGHT = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount: 3, unit: 'mg/kg' } });

/** Preoxygenated, correctly dosed, and ventilated like an adult. */
const adultTidalVolume: readonly LearnerAction[] = [
  VENTILATE(100, 140), PROPOFOL_BY_WEIGHT(1500), VENTILATE(1800, 450),
];

export const ROUTINE_PEDIATRIC_IV_INDUCTION_FIXTURES = {
  scenarioId: 'routine-pediatric-iv-induction', contentVersion: '0.1.0',
  seed: 6390, ticks: 5400,

  /** Nobody is induced, so no objective is exercised at all. */
  noAction: [] as readonly LearnerAction[],

  /** Preoxygenate, 3 mg/kg by weight, and a child-sized breath. */
  expert: [
    VENTILATE(100, 140), PROPOFOL_BY_WEIGHT(1500), VENTILATE(1800, 140),
  ] as readonly LearnerAction[],

  /** 450 mL into a twenty-kilogram child. */
  commonError: adultTidalVolume,

  /** The same transcript, with the breath resized in time. */
  recovery: [...adultTidalVolume, VENTILATE(2400, 140)] as readonly LearnerAction[],
} as const;
