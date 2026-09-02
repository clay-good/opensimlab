import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CapHypoxemiaProgress } from '../community-acquired-pneumonia-hypoxemia-reassessment';
import { capHypoxemiaDemonstrationStep } from './community-acquired-pneumonia-hypoxemia-reassessment-demonstration';

export function useCapHypoxemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: CapHypoxemiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: capHypoxemiaDemonstrationStep(patient),
    actionType: 'community-acquired-pneumonia-hypoxemia-response', act, pause, play, onFinished });
}
