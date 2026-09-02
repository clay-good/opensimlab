import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricSvtProgress } from '../pediatric-supraventricular-tachycardia';
import { pediatricSvtDemonstrationStep } from './pediatric-svt-demonstration';

export function usePediatricSvtDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PediatricSvtProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: pediatricSvtDemonstrationStep(patient),
    actionType: 'pediatric-supraventricular-tachycardia-response', act, pause, play, onFinished });
}
