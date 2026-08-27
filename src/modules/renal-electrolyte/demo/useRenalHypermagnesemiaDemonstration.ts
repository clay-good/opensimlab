import type { LearnerAction, RenalHypermagnesemiaSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { renalHypermagnesemiaDemonstrationStep } from './renal-hypermagnesemia-demonstration';

export function useRenalHypermagnesemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: RenalHypermagnesemiaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: renalHypermagnesemiaDemonstrationStep(patient),
    actionType: 'renal-hypermagnesemia-response', act, pause, play, onFinished });
}
