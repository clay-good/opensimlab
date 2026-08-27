import type { LearnerAction, HyponatremiaCorrectionSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { hyponatremiaCorrectionDemonstrationStep } from './hyponatremia-correction-demonstration';

export function useHyponatremiaCorrectionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly patient?: HyponatremiaCorrectionSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: hyponatremiaCorrectionDemonstrationStep(patient),
    actionType: 'hyponatremia-correction-response', act, pause, play, onFinished });
}
