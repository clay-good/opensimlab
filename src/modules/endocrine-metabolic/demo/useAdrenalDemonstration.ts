import type { LearnerAction, AdrenalCrisisSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { adrenalDemonstrationStep } from './adrenal-demonstration';

export function useAdrenalDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly patient?: AdrenalCrisisSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: adrenalDemonstrationStep(patient),
    actionType: 'adrenal-crisis-response', act, pause, play, onFinished });
}
