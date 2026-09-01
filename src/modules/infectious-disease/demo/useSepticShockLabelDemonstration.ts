import type { SepticShockLabelSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { septicShockLabelDemonstrationStep } from './septic-shock-label-demonstration';

export function useSepticShockLabelDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: SepticShockLabelSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: septicShockLabelDemonstrationStep(patient),
    actionType: 'septic-shock-label-response', act, pause, play, onFinished });
}
