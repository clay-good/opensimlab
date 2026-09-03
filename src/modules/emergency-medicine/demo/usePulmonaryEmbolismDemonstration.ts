import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PulmonaryEmbolismProgress } from '../pulmonary-embolism-deterioration';
import { pulmonaryEmbolismDemonstrationStep } from './pulmonary-embolism-deterioration-demonstration';

export function usePulmonaryEmbolismDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PulmonaryEmbolismProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pulmonaryEmbolismDemonstrationStep(patient),
    actionType: 'pulmonary-embolism-deterioration-response', act, pause, play, onFinished });
}
