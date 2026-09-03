import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { UnstableBradycardiaProgress } from '../unstable-bradycardia';
import { unstableBradycardiaDemonstrationStep } from './unstable-bradycardia-demonstration';

export function useUnstableBradycardiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: UnstableBradycardiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: unstableBradycardiaDemonstrationStep(patient),
    actionType: 'unstable-bradycardia-response', act, pause, play, onFinished });
}
