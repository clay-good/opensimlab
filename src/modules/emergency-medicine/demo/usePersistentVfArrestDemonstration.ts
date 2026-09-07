import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PersistentVfProgress } from '../persistent-vf-arrest';
import { persistentVfDemonstrationStep } from './persistent-vf-arrest-demonstration';

export function usePersistentVfArrestDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PersistentVfProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: persistentVfDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'chest-compressions', act, pause, play, onFinished });
}
