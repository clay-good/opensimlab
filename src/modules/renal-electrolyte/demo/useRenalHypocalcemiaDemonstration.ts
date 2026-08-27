import type { LearnerAction, RenalHypocalcemiaSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { renalHypocalcemiaDemonstrationStep } from './renal-hypocalcemia-demonstration';

export function useRenalHypocalcemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: RenalHypocalcemiaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: renalHypocalcemiaDemonstrationStep(patient),
    actionType: 'renal-hypocalcemia-response', act, pause, play, onFinished });
}
