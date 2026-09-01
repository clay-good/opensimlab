import type { MeningitisImagingSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { meningitisImagingDemonstrationStep } from './meningitis-imaging-demonstration';

export function useMeningitisImagingDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MeningitisImagingSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: meningitisImagingDemonstrationStep(patient),
    actionType: 'meningitis-imaging-response', act, pause, play, onFinished });
}
