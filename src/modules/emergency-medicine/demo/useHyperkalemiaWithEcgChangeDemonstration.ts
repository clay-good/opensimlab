import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { HyperkalemiaWithEcgChangeProgress } from '../hyperkalemia-with-ecg-change';
import { hyperkalemiaWithEcgChangeDemonstrationStep } from './hyperkalemia-with-ecg-change-demonstration';

export function useHyperkalemiaWithEcgChangeDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: HyperkalemiaWithEcgChangeProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: hyperkalemiaWithEcgChangeDemonstrationStep(patient),
    // The engine action type is shorter than the scenario id.
    actionType: 'hyperkalemia-response', act, pause, play, onFinished });
}
