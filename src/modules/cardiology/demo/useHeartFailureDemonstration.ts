import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { HeartFailureProgress } from '../heart-failure';
import { heartFailureDemonstrationStep } from './heart-failure-demonstration';

export function useHeartFailureDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: HeartFailureProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: heartFailureDemonstrationStep(patient),
    actionType: 'heart-failure-response', act, pause, play, onFinished });
}
