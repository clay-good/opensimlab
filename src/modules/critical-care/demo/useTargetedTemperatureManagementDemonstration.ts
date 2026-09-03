import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { TargetedTemperatureManagementProgress } from '../targeted-temperature-management';
import { targetedTemperatureManagementDemonstrationStep } from './targeted-temperature-management-demonstration';

export function useTargetedTemperatureManagementDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: TargetedTemperatureManagementProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: targetedTemperatureManagementDemonstrationStep(patient),
    actionType: 'targeted-temperature-management-response', act, pause, play, onFinished });
}
