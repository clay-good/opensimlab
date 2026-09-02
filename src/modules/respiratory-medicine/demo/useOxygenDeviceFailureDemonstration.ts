import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { OxygenDeviceFailureProgress } from '../oxygen-device-failure';
import { oxygenDeviceFailureDemonstrationStep } from './oxygen-device-failure-demonstration';

export function useOxygenDeviceFailureDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: OxygenDeviceFailureProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: oxygenDeviceFailureDemonstrationStep(patient),
    actionType: 'oxygen-device-failure-response', act, pause, play, onFinished });
}
