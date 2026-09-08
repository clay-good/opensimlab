import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { DelayedEmergenceProgress } from './delayed-emergence-demonstration';
import { delayedEmergenceDemonstrationStep } from './delayed-emergence-demonstration';

export function useDelayedEmergenceDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: DelayedEmergenceProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: delayedEmergenceDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'delayed-emergence-assessment', act, pause, play, onFinished });
}
