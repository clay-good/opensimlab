import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CopdTransitionProgress } from '../copd-exacerbation-transition-reassessment';
import { copdTransitionDemonstrationStep } from './copd-exacerbation-transition-reassessment-demonstration';

export function useCopdTransitionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: CopdTransitionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: copdTransitionDemonstrationStep(patient),
    actionType: 'copd-exacerbation-transition-response', act, pause, play, onFinished });
}
