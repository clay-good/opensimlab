import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PostTensionPneumothoraxProgress } from '../spontaneous-tension-pneumothorax-post-drainage-reassessment';
import { postTensionPneumothoraxDemonstrationStep } from './spontaneous-tension-pneumothorax-post-drainage-reassessment-demonstration';

export function usePostTensionPneumothoraxDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PostTensionPneumothoraxProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: postTensionPneumothoraxDemonstrationStep(patient),
    actionType: 'spontaneous-tension-pneumothorax-post-drainage-response', act, pause, play, onFinished });
}
