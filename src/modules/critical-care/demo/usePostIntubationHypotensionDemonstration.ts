import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PostIntubationHypotensionProgress } from '../post-intubation-hypotension';
import { postIntubationHypotensionDemonstrationStep } from './post-intubation-hypotension-demonstration';

export function usePostIntubationHypotensionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PostIntubationHypotensionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: postIntubationHypotensionDemonstrationStep(patient),
    actionType: 'post-intubation-hypotension-response', act, pause, play, onFinished });
}
