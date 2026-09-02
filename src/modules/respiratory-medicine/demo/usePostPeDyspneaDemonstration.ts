import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PostPeDyspneaProgress } from '../post-pulmonary-embolism-persistent-dyspnea';
import { postPeDyspneaDemonstrationStep } from './post-pulmonary-embolism-persistent-dyspnea-demonstration';

export function usePostPeDyspneaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PostPeDyspneaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: postPeDyspneaDemonstrationStep(patient),
    actionType: 'post-pulmonary-embolism-persistent-dyspnea-response', act, pause, play, onFinished });
}
