import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { SevereHyponatremiaProgress } from '../severe-hyponatremia-with-seizure';
import { severeHyponatremiaDemonstrationStep } from './severe-hyponatremia-with-seizure-demonstration';

export function useSevereHyponatremiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: SevereHyponatremiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: severeHyponatremiaDemonstrationStep(patient),
    // The engine action type is shorter than the scenario id.
    actionType: 'hyponatremia-response', act, pause, play, onFinished });
}
