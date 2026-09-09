import type { Scenario } from '../scenarios/types';
import { PREPARING_NARRATION } from './demonstration';
import type { DemonstrationBeat } from './demonstration';
import type { LearnerAction } from '@platform/kernel/protocol';
import { supportsPneumothoraxUnderPositivePressure } from '../pneumothorax-under-positive-pressure';

/**
 * What this worked example reads.
 *
 * The twenty-third observed-state demonstration in the anaesthesia module. Like
 * the opioid lesson it opens with a beat that does nothing, because every
 * objective is timed from the scripted pleural event and an action taken before
 * it is invisible to the rubric rather than merely early.
 */
export interface PneumothoraxProgress {
  readonly severity: number;
  readonly assessedAtTick: number | null;
  readonly helpRequestedAtTick: number | null;
  readonly inspiredOxygenFraction: number;
  readonly ventilatorDelivering: boolean;
  readonly decompressedAtTick: number | null;
}

export const PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPneumothoraxUnderPositivePressureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0'
    && supportsPneumothoraxUnderPositivePressure(scenario);
}

export interface PneumothoraxDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly dispatch?: Omit<LearnerAction, 'tick'>;
  readonly finished?: boolean;
}

const respond = (action: string): Omit<LearnerAction, 'tick'> =>
  ({ type: 'pneumothorax-response', payload: { action } });

/**
 * The worked example for the chest that cannot empty.
 *
 * Read from the latest stage backwards, as the twenty-two before it are.
 *
 * It decompresses nobody's chest and predicts no outcome for any person.
 */
export function pneumothoraxDemonstrationStep(
  patient?: PneumothoraxProgress,
): PneumothoraxDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.decompressedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The chest is decompressed and the pressure and saturation climb back. Two things to carry away. The first is the run this example did not take: a learner who answers the falling saturation by turning the oxygen to 100% and the rate to 20, and does nothing else, earns the oxygenation objective and no other, and the mean arterial pressure sits at 33 mmHg for the rest of the case. More minute ventilation is not a treatment for a tension pneumothorax — under positive pressure it is closer to the cause. The second is a defect in this lesson rather than a lesson in itself, and it is stated here because you will meet it: the fifth objective asks for a mean arterial pressure of at least 65 mmHg after decompression, and this model tops out at 64.71. Nothing you can do earns it. A perfect run scores four of five, the shortfall is 0.29 mmHg, and it is recorded in the completion evidence rather than hidden. Decompression here is recorded intent — technique, site, equipment and complications are not simulated. This ends the example, not the evaluation.' };
  }
  if (patient.inspiredOxygenFraction >= 1 && patient.ventilatorDelivering) {
    return { id: 'decompress', focus: 'actions', progress: 0.8,
      dispatch: respond('decompress-left-chest'),
      narration: 'Now decompress the left chest. This is the only action in the lesson that treats the problem: everything before it buys time or information, and none of it lets the chest empty. The objective allows 60 seconds from the moment the pattern began, and the reason to move before imaging is that the diagnosis is being made by the blood pressure rather than confirmed by a picture.' };
  }
  if (patient.helpRequestedAtTick !== null) {
    return { id: 'oxygen', focus: 'actions', progress: 0.6,
      dispatch: { type: 'ventilator',
        payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
      narration: 'Turn the inspired oxygen to 100% while the decompression is prepared, and leave the rate where it is. Raising the rate is the reflex the falling saturation invites, and it is the wrong one here: each delivered breath adds to a space that has no way out. Oxygen buys margin; more breaths spend it.' };
  }
  if (patient.assessedAtTick !== null) {
    return { id: 'escalate', focus: 'actions', progress: 0.4,
      dispatch: { type: 'call-for-help', payload: { context: 'tension-pneumothorax' } },
      narration: 'Call for help now, in the same breath as the assessment rather than after deciding what to do. The objective allows 30 seconds. This is a diagnosis that is treated in minutes by whoever is already in the room, and the request is what makes a second pair of hands available for the decompression rather than for the aftermath.' };
  }
  if (patient.severity > 0.05) {
    return { id: 'assess', focus: 'monitor', progress: 0.2,
      dispatch: respond('assess-bilateral-ventilation'),
      narration: 'Assess bilateral ventilation first. The saturation is falling and the pressure with it, and those two together under positive-pressure ventilation are a short differential — the question that separates it is whether both sides are being ventilated. Reduced air entry on one side with the other preserved is the finding, and it takes seconds to look for.' };
  }
  return { id: 'watching', focus: 'monitor', progress: 0.05,
    narration: 'Nothing has happened yet, and this beat waits on purpose. Every objective in this lesson is timed from the moment the pleural event begins, and an action taken before it is not early — the rubric does not see it at all. Watch the saturation and the pressure together and let the pattern appear.' };
}
