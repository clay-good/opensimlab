import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { BronchospasmProgress } from './bronchospasm-demonstration';
import { bronchospasmDemonstrationStep } from './bronchospasm-demonstration';

export function useBronchospasmDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: BronchospasmProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: bronchospasmDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'ventilator', act, pause, play, onFinished });
}
