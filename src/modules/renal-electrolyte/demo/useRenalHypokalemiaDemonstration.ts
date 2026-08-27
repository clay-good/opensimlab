import type { LearnerAction, RenalHypokalemiaSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { renalHypokalemiaDemonstrationStep } from './renal-hypokalemia-demonstration';

export function useRenalHypokalemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: RenalHypokalemiaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: renalHypokalemiaDemonstrationStep(patient),
    actionType: 'renal-hypokalemia-response', act, pause, play, onFinished });
}
