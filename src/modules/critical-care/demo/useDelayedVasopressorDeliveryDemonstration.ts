import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { DelayedVasopressorDeliveryProgress } from '../delayed-vasopressor-delivery';
import { delayedVasopressorDeliveryDemonstrationStep } from './delayed-vasopressor-delivery-demonstration';

export function useDelayedVasopressorDeliveryDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: DelayedVasopressorDeliveryProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: delayedVasopressorDeliveryDemonstrationStep(patient),
    actionType: 'delayed-vasopressor-delivery-response', act, pause, play, onFinished });
}
