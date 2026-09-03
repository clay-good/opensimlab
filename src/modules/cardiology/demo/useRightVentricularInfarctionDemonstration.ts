import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { RightVentricularInfarctionProgress } from '../right-ventricular-infarction';
import { rightVentricularInfarctionDemonstrationStep } from './right-ventricular-infarction-demonstration';

export function useRightVentricularInfarctionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: RightVentricularInfarctionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: rightVentricularInfarctionDemonstrationStep(patient),
    actionType: 'right-ventricular-infarction-response', act, pause, play, onFinished });
}
