import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { DigoxinProgress } from '../digoxin-rhythm-potassium';
import { digoxinDemonstrationStep } from './digoxin-rhythm-potassium-demonstration';

export function useDigoxinDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: DigoxinProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: digoxinDemonstrationStep(patient),
    actionType: 'digoxin-rhythm-potassium-response', act, pause, play, onFinished });
}
