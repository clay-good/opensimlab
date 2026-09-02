import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { OpioidXylazineProgress } from '../opioid-xylazine-persistent-sedation';
import { opioidXylazineDemonstrationStep } from './opioid-xylazine-persistent-sedation-demonstration';

export function useOpioidXylazineDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: OpioidXylazineProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: opioidXylazineDemonstrationStep(patient),
    actionType: 'opioid-xylazine-persistent-sedation-response', act, pause, play, onFinished });
}
