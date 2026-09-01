import type { PossibleSepsisSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { possibleSepsisDemonstrationStep } from './possible-sepsis-demonstration';

export function usePossibleSepsisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PossibleSepsisSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: possibleSepsisDemonstrationStep(patient),
    actionType: 'possible-sepsis-response', act, pause, play, onFinished });
}
