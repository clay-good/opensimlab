import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AkiFluidOverloadProgress } from '../aki-fluid-overload';
import { akiFluidOverloadDemonstrationStep } from './aki-fluid-overload-demonstration';

export function useAkiFluidOverloadDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: AkiFluidOverloadProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: akiFluidOverloadDemonstrationStep(patient),
    actionType: 'aki-fluid-overload-response', act, pause, play, onFinished });
}
