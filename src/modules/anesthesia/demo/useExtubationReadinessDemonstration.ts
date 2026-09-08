import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { ExtubationReadinessProgress } from './extubation-readiness-demonstration';
import { extubationReadinessDemonstrationStep } from './extubation-readiness-demonstration';

export function useExtubationReadinessDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: ExtubationReadinessProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: extubationReadinessDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'extubation-readiness-assessment', act, pause, play, onFinished });
}
