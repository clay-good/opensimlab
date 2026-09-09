import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { RepeatedLaryngoscopyProgress } from './repeated-laryngoscopy-demonstration';
import { repeatedLaryngoscopyDemonstrationStep } from './repeated-laryngoscopy-demonstration';

export function useRepeatedLaryngoscopyDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: RepeatedLaryngoscopyProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: repeatedLaryngoscopyDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'laryngoscopy', act, pause, play, onFinished });
}
