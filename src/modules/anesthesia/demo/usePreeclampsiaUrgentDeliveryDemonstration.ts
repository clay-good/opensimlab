import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { PreeclampsiaUrgentDeliveryProgress } from './preeclampsia-urgent-delivery-demonstration';
import { preeclampsiaUrgentDeliveryDemonstrationStep } from './preeclampsia-urgent-delivery-demonstration';

export function usePreeclampsiaUrgentDeliveryDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PreeclampsiaUrgentDeliveryProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: preeclampsiaUrgentDeliveryDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'preeclampsia-response', act, pause, play, onFinished });
}
