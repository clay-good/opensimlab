import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { SepticShockProgress } from '../septic-shock';
import { septicShockDemonstrationStep } from './septic-shock-demonstration';

export function useSepticShockDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: SepticShockProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: septicShockDemonstrationStep(patient),
    // The engine action type is `-assessment`, not `-response`.
    actionType: 'septic-shock-assessment', act, pause, play, onFinished });
}
