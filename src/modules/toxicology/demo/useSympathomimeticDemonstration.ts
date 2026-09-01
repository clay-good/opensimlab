import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { SympathomimeticProgress } from '../sympathomimetic-hyperadrenergic-hyperthermia';
import { sympathomimeticDemonstrationStep } from './sympathomimetic-hyperadrenergic-hyperthermia-demonstration';

export function useSympathomimeticDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: SympathomimeticProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: sympathomimeticDemonstrationStep(patient),
    actionType: 'sympathomimetic-hyperadrenergic-hyperthermia-response', act, pause, play, onFinished });
}
