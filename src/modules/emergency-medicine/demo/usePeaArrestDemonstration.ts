import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PeaArrestProgress } from '../pea-arrest';
import { peaArrestDemonstrationStep } from './pea-arrest-demonstration';

export function usePeaArrestDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PeaArrestProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: peaArrestDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'chest-compressions', act, pause, play, onFinished });
}
