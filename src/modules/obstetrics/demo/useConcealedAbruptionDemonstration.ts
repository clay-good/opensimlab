import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { ConcealedAbruptionProgress } from '../concealed-placental-abruption-hemorrhage';
import { concealedAbruptionDemonstrationStep } from './concealed-placental-abruption-hemorrhage-demonstration';

export function useConcealedAbruptionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: ConcealedAbruptionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: concealedAbruptionDemonstrationStep(patient),
    actionType: 'concealed-placental-abruption-hemorrhage-response', act, pause, play, onFinished });
}
