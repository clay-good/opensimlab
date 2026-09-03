import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { UpperGiHemorrhageProgress } from '../upper-gi-hemorrhage';
import { upperGiHemorrhageDemonstrationStep } from './upper-gi-hemorrhage-demonstration';

export function useUpperGiHemorrhageDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: UpperGiHemorrhageProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: upperGiHemorrhageDemonstrationStep(patient),
    actionType: 'upper-gi-hemorrhage-response', act, pause, play, onFinished });
}
