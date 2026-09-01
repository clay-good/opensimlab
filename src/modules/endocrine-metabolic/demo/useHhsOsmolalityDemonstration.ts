import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { HhsOsmolalityProgress } from '../hhs-osmolality';
import { hhsOsmolalityDemonstrationStep } from './hhs-osmolality-demonstration';

export function useHhsOsmolalityDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: HhsOsmolalityProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: hhsOsmolalityDemonstrationStep(patient),
    actionType: 'hhs-osmolality-trajectory-response', act, pause, play, onFinished });
}
