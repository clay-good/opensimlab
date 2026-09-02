import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PostInfarctionShockProgress } from '../post-infarction-shock';
import { postInfarctionShockDemonstrationStep } from './post-infarction-shock-demonstration';

export function usePostInfarctionShockDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PostInfarctionShockProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: postInfarctionShockDemonstrationStep(patient),
    actionType: 'post-infarction-shock-response', act, pause, play, onFinished });
}
