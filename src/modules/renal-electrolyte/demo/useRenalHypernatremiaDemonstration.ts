import type { LearnerAction, RenalHypernatremiaSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { renalHypernatremiaDemonstrationStep } from './renal-hypernatremia-demonstration';

export function useRenalHypernatremiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: RenalHypernatremiaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: renalHypernatremiaDemonstrationStep(patient),
    actionType: 'renal-hypernatremia-response', act, pause, play, onFinished });
}
