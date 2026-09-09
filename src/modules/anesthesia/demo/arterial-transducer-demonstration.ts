import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsArterialPressureTransducerArtifact } from '../arterial-pressure-transducer-artifact';

/**
 * What this worked example reads.
 *
 * The thirty-second observed-state demonstration in the anaesthesia module, and
 * the eighth to open with a beat that deliberately does nothing.
 *
 * Its gates read two artifacts that CLEAR and two flags that latch. The closing
 * gate needs both corrections plus the latched waveform assessment, because the
 * cleared state is also the state before the artifacts arrive.
 */
export interface ArterialTransducerProgress {
  readonly mislevelingCm: number;
  readonly dynamicResponse: string;
  readonly waveformAssessed: boolean;
  readonly leveledAndZeroed: boolean;
  readonly cuffStatus: string;
  readonly cuffMeanArterialMmHg: number | null;
}

export const ARTERIAL_TRANSDUCER_DEMONSTRATION_VERSION = '0.1.0';

export function supportsArterialTransducerDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsArterialPressureTransducerArtifact(scenario);
}

export interface ArterialTransducerDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const line = (action: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'arterial-line', payload: { action } });

/**
 * The worked example for the pressure that was never low.
 *
 * Read from the latest stage backwards, as the thirty-one before it are.
 *
 * It treats nobody and predicts no outcome for any person.
 */
export function arterialTransducerDemonstrationStep(
  patient?: ArterialTransducerProgress,
): ArterialTransducerDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.waveformAssessed && patient.leveledAndZeroed
    && patient.dynamicResponse === 'normal' && patient.mislevelingCm === 0) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'Both faults corrected, and nothing was given to the patient. The measurement worth carrying away is that the true mean arterial pressure was 78 mmHg for this entire case — before the display fell, while it read 63, and now. The 15 mmHg gap was a 20 cm column of water and nothing else. A run that answers the displayed 63 with a litre of crystalloid is treating a number that was never wrong, and the cuff it eventually cycles reports the same 78 the patient had all along. That run does not lose the first objective for cuffing late; it loses it for cuffing AFTER the fluid. The measure is about order, and the order encodes the point: an independent reading costs 30 seconds and settles whether there is anything to treat. One more ordering: the damping cannot be corrected before the waveform is assessed — the engine refuses it — which is the difference between replacing tubing because a trace looks wrong and replacing it because you looked. Limits: both artifacts are display-only, and every action here is screen intent rather than physical technique. This ends the example, not the evaluation.' };
  }
  if (patient.waveformAssessed && patient.dynamicResponse === 'overdamped') {
    return { id: 'restore', focus: 'actions', progress: 0.85,
      dispatch: line('restore-dynamic-response'),
      narration: 'Now correct the dynamic response. This is accepted only because the waveform was assessed first — reach for it before looking and the engine declines it. An over-damped trace under-reads a systolic and over-reads a diastolic while leaving the mean roughly intact, so the fault matters most to the numbers a learner is most tempted to act on.' };
  }
  if (patient.leveledAndZeroed && !patient.waveformAssessed) {
    return { id: 'assess', focus: 'monitor', progress: 0.7,
      dispatch: line('assess-waveform'),
      narration: 'Levelling fixed the offset but not the shape. Assess the waveform: a blunted upstroke with no dicrotic notch is over-damping, which is a second and separate fault from the transducer height. Two artifacts arrived together here, and correcting one does not reveal the other unless you look for it.' };
  }
  if (patient.cuffStatus === 'cycling') {
    return { id: 'cycling', focus: 'monitor', progress: 0.42,
      narration: 'The cuff is inflating. Nothing to add while it runs — this beat holds the window so the example does not re-request a cycle that is already in progress, and so the wait itself is visible. Half a minute is the entire cost of knowing whether this pressure is real.' };
  }
  if (patient.cuffMeanArterialMmHg !== null) {
    return { id: 'level', focus: 'actions', progress: 0.55,
      dispatch: line('level-zero'),
      narration: 'The cuff has answered, and it disagrees with the arterial trace. Level and zero the transducer: a transducer 20 cm above the phlebostatic axis subtracts about 15 mmHg of hydrostatic pressure from every reading, which is very close to the gap you are looking at. The number on the screen was arithmetic, not physiology.' };
  }
  if (patient.mislevelingCm > 0 || patient.dynamicResponse === 'overdamped') {
    return { id: 'verify', focus: 'monitor', progress: 0.3,
      dispatch: line('cycle-cuff'),
      narration: 'Cycle the cuff before doing anything to the patient. This is the whole lesson in one action: an abrupt change in one measurement, with every other sign unchanged, is a measurement problem until an independent measurement says otherwise. The objective allows 60 seconds and it also requires this to come BEFORE any fluid or drug — treat first and the mark is lost even if the cuff follows immediately.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'A stable case with a normal arterial trace, and nothing to do. Both bounded corrections are refused while no fault is active, and every objective is timed from the moment the display changes. Watch what else on the screen moves when it does — the answer is nothing.' };
}
