import type { LearnerAction, RenalHyperkalemiaSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { renalHyperkalemiaDemonstrationStep } from './renal-hyperkalemia-demonstration';

export function useRenalHyperkalemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: RenalHyperkalemiaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: renalHyperkalemiaDemonstrationStep(patient),
    actionType: 'renal-hyperkalemia-response', act, pause, play, onFinished });
}
