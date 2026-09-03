import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { UnplannedExtubationProgress } from '../unplanned-extubation';
import { unplannedExtubationDemonstrationStep } from './unplanned-extubation-demonstration';

export function useUnplannedExtubationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: UnplannedExtubationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: unplannedExtubationDemonstrationStep(patient),
    actionType: 'unplanned-extubation-response', act, pause, play, onFinished });
}
