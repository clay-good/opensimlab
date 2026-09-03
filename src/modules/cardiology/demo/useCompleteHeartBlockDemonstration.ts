import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CompleteHeartBlockProgress } from '../complete-heart-block';
import { completeHeartBlockDemonstrationStep } from './complete-heart-block-demonstration';

export function useCompleteHeartBlockDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: CompleteHeartBlockProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: completeHeartBlockDemonstrationStep(patient),
    actionType: 'complete-heart-block-response', act, pause, play, onFinished });
}
