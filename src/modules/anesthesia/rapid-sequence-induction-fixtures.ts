import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the rapid-sequence-induction lesson.
 *
 * The counterfactual is haste, again, but a different kind of it. The two
 * lessons before this one were about a clock the learner could read wrongly.
 * This one is about an order the learner can get backwards, and about a drug
 * that has to be taken back off the patient before the case can end.
 *
 * The error path is the hurried induction whole: no oxygen at all, rocuronium
 * before the propofol, an airway taken while the block is still developing, and
 * ventilation resumed two minutes after apnoea began. Measured through the
 * solver the saturation reaches 72%, and the depth-index alarm fires at tick
 * 3,801 — she is paralysed and light, which is the harm the wrong order causes
 * and which no objective here scores.
 *
 * The recovery path keeps the missing preoxygenation exactly. It gives the
 * hypnotic first, waits for the count to reach zero, takes the airway at tick
 * 1,250 rather than 1,400 and ventilates a hundred ticks later, and reverses the
 * block against its observed depth. It recovers eight points of saturation —
 * 80% against 72% — and preoxygenate-before-induction is not met and stays that
 * way, because a reserve that was never built cannot be built afterwards.
 *
 * The expert path is the only one that reverses on the descending limb with the
 * dose the observed depth actually supports. That is not a formality: the engine
 * refuses 2 mg/kg with no twitches, refuses 4 mg/kg without a post-tetanic
 * count, and refuses either while the block is still deepening.
 */

const OXYGEN: LearnerAction = { tick: 120, type: 'ventilator', payload: { fio2: 1 } };
const REMIFENTANIL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'remifentanil', amount: 50, unit: 'µg' } });
const PROPOFOL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount: 1.5, unit: 'mg/kg' } });
// A maintenance dose, not a chase: it is given more than eighteen times the
// hundred-second time to peak after the induction bolus, once the depth index
// has started to drift back up under a block that is still complete.
const TOP_UP = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount: 50, unit: 'mg' } });
// 0.6 mg/kg rather than the 1.0 the syringe also offers. The larger dose gives a
// block this bounded model does not bring back inside the run, and a transcript
// that ended with the patient still paralysed could not exercise the reversal
// objective at all. The choice is the lesson's, and the scenario leaves it open.
const ROCURONIUM = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'rocuronium', amount: 0.6, unit: 'mg/kg' } });
const VENTILATE = (tick: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } });
const REVERSE = (tick: number): LearnerAction => ({
  tick, type: 'neuromuscular-reversal',
  payload: { agent: 'sugammadex', route: 'iv', doseMgPerKg: 4 },
});

export const RAPID_SEQUENCE_INDUCTION_FIXTURES = {
  scenarioId: 'rapid-sequence-induction', contentVersion: '0.2.0', seed: 3120, ticks: 7200,

  /** Nothing is done at all. She keeps breathing, and nothing is exercised. */
  noAction: [] as readonly LearnerAction[],

  /**
   * Oxygen, a wait measured on the end-tidal clock, the hypnotic before the
   * relaxant, the airway once the count is zero, and the block taken back off
   * her before the run ends.
   */
  expert: [
    OXYGEN,
    REMIFENTANIL(2100),
    PROPOFOL(2150),
    ROCURONIUM(2200),
    { tick: 2800, type: 'laryngoscopy', payload: { technique: 'video' } },
    VENTILATE(2900),
    TOP_UP(4800),
    REVERSE(5400),
  ] as readonly LearnerAction[],

  /** No reserve, the order backwards, a late airway, and nothing reversed. */
  commonError: [
    ROCURONIUM(560),
    PROPOFOL(620),
    { tick: 1400, type: 'laryngoscopy', payload: { technique: 'direct' } },
    VENTILATE(2600),
  ] as readonly LearnerAction[],

  /** The same missing reserve, the right order, a prompt airway, and reversal. */
  recovery: [
    REMIFENTANIL(560),
    PROPOFOL(620),
    ROCURONIUM(680),
    { tick: 1250, type: 'laryngoscopy', payload: { technique: 'video' } },
    VENTILATE(1350),
    TOP_UP(3200),
    REVERSE(3900),
  ] as readonly LearnerAction[],
} as const;
