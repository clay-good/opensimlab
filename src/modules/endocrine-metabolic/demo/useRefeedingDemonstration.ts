import type { LearnerAction, RefeedingSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { refeedingDemonstrationStep } from './refeeding-demonstration';

export function useRefeedingDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly patient?: RefeedingSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: refeedingDemonstrationStep(patient),
    actionType: 'refeeding-response', act, pause, play, onFinished });
}
