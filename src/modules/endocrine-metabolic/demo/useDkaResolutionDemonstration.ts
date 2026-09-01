import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { DkaResolutionProgress } from '../dka-resolution';
import { dkaResolutionDemonstrationStep } from './dka-resolution-demonstration';

export function useDkaResolutionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: DkaResolutionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: dkaResolutionDemonstrationStep(patient),
    actionType: 'dka-resolution-transition-response', act, pause, play, onFinished });
}
