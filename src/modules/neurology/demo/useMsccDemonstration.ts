import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MsccProgress } from '../metastatic-spinal-cord-compression';
import { msccDemonstrationStep } from './metastatic-spinal-cord-compression-demonstration';

export function useMsccDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MsccProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: msccDemonstrationStep(patient),
    actionType: 'metastatic-spinal-cord-compression-response', act, pause, play, onFinished });
}
