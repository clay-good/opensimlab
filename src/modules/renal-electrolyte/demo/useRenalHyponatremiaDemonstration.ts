import type { LearnerAction, RenalHyponatremiaSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { renalHyponatremiaDemonstrationStep } from './renal-hyponatremia-demonstration';

export function useRenalHyponatremiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: RenalHyponatremiaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: renalHyponatremiaDemonstrationStep(patient),
    actionType: 'renal-hyponatremia-response', act, pause, play, onFinished });
}
