import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { LaryngospasmProgress } from './laryngospasm-demonstration';
import { laryngospasmDemonstrationStep } from './laryngospasm-demonstration';

export function useLaryngospasmDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: LaryngospasmProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: laryngospasmDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'ventilator', act, pause, play, onFinished });
}
