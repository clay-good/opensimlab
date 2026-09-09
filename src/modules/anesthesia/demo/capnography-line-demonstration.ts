import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsCapnographySamplingLineObstruction } from '../capnography-sampling-line-obstruction';

/**
 * What this worked example reads.
 *
 * The thirtieth observed-state demonstration in the anaesthesia module, and the
 * only one whose central instruction is to do less. It gates on the artifact
 * being present and on the latched cross-check flag; the closing gate reads the
 * artifact having CLEARED, which cannot be true before the fault since the
 * example only ever clears it itself.
 */
export interface CapnographyLineProgress {
  readonly samplingLineObstructed: boolean;
  readonly ventilationCrossChecked: boolean;
  readonly spontaneousRateBpm: number;
  readonly spo2Percent: number;
}

export const CAPNOGRAPHY_LINE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCapnographyLineDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsCapnographySamplingLineObstruction(scenario);
}

export interface CapnographyLineDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

/**
 * The worked example for the alarm that is about the monitor.
 *
 * Read from the latest stage backwards, as the twenty-nine before it are.
 *
 * It instruments nobody's airway and predicts no outcome for any person.
 */
export function capnographyLineDemonstrationStep(
  patient?: CapnographyLineProgress,
): CapnographyLineDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ventilationCrossChecked && !patient.samplingLineObstructed) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The waveform is back and nothing was done to the patient. The comparison this lesson exists for is uncomfortable. A run that answers the flat trace with a laryngoscope loses the middle objective outright, and it does not only lose a mark: the spontaneous respiratory rate falls to zero and the lowest saturation to 96%, so the apnoea that was feared is the one the learner produced. A run that takes over the ventilator instead is graded partly met — a real gradient, because commandeering the breathing is a smaller intrusion than instrumenting the airway — and the patient keeps a rate and a saturation. And the most pointed measurement of all: a run that does NOTHING earns this objective in full. Doing nothing is the only thing a completely passive learner gets credit for here, and it is credit rather than luck, because the correct response to a monitor fault in a well patient really is to leave the patient alone. One irreversibility worth knowing: reconnect the line before cross-checking and the cross-check is then refused, because there is no longer a fault to check ventilation against. The first objective is lost permanently. Limits: this obstruction is display-only, and the cross-check is screen intent rather than a physical examination. This ends the example, not the evaluation.' };
  }
  if (patient.ventilationCrossChecked) {
    return { id: 'restore', focus: 'actions', progress: 0.8,
      dispatch: { type: 'capnography-line', payload: { action: 'reconnect' } },
      narration: 'Now restore the sample path — 60 seconds is the window, and it comes AFTER the cross-check rather than before. That order matters more than it looks: clear the fault first and the cross-check is refused outright, because there is no longer a fault to check the patient against, and the first objective is gone for good.' };
  }
  if (patient.samplingLineObstructed) {
    return { id: 'cross-check', focus: 'monitor', progress: 0.5,
      dispatch: { type: 'capnography-line', payload: { action: 'cross-check-ventilation' } },
      narration: 'Cross-check the ventilation before touching anything else — 30 seconds is the window. Chest movement, the saturation, the plethysmogram: three independent signs that this patient is ventilating, none of which come down the sampling line. A capnogram that vanishes in one step while every other trace stays normal is a monitor fault until proven otherwise, and the proof takes seconds.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'A stable maintenance phase, and nothing to do. Both sampling-line actions are refused while the trace is normal, and both objectives that can be earned are timed from the moment it is not. Watch, and notice how much of the screen would still be telling you the truth if the capnogram stopped.' };
}
