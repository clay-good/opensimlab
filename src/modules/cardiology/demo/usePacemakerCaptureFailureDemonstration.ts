import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PacemakerCaptureFailureProgress } from '../pacemaker-capture-failure';
import { pacemakerCaptureFailureDemonstrationStep } from './pacemaker-capture-failure-demonstration';

export function usePacemakerCaptureFailureDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PacemakerCaptureFailureProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pacemakerCaptureFailureDemonstrationStep(patient),
    actionType: 'pacemaker-capture-failure-response', act, pause, play, onFinished });
}
