import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AsahProgress } from '../aneurysmal-subarachnoid-hemorrhage-deterioration';
import { asahDemonstrationStep } from './aneurysmal-subarachnoid-hemorrhage-deterioration-demonstration';

export function useAsahDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: AsahProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: asahDemonstrationStep(patient),
    actionType: 'aneurysmal-subarachnoid-hemorrhage-deterioration-response', act, pause, play, onFinished });
}
