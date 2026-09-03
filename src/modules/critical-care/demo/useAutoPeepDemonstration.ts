import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AutoPeepProgress } from '../auto-peep';
import { autoPeepDemonstrationStep } from './auto-peep-demonstration';

export function useAutoPeepDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: AutoPeepProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: autoPeepDemonstrationStep(patient),
    actionType: 'auto-peep-response', act, pause, play, onFinished });
}
