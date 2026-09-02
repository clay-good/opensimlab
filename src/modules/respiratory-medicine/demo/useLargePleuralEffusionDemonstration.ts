import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { LargePleuralEffusionProgress } from '../large-unilateral-pleural-effusion-reassessment';
import { largePleuralEffusionDemonstrationStep } from './large-unilateral-pleural-effusion-reassessment-demonstration';

export function useLargePleuralEffusionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: LargePleuralEffusionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: largePleuralEffusionDemonstrationStep(patient),
    actionType: 'large-unilateral-pleural-effusion-response', act, pause, play, onFinished });
}
