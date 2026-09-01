import type { ObstructedKidneySnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { obstructedKidneyDemonstrationStep } from './obstructed-kidney-demonstration';

export function useObstructedKidneyDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: ObstructedKidneySnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: obstructedKidneyDemonstrationStep(patient),
    actionType: 'obstructed-kidney-response', act, pause, play, onFinished });
}
