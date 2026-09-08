import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { AwarenessUnderParalysisProgress } from './awareness-under-paralysis-demonstration';
import { awarenessUnderParalysisDemonstrationStep } from './awareness-under-paralysis-demonstration';

export function useAwarenessUnderParalysisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: AwarenessUnderParalysisProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: awarenessUnderParalysisDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'ventilator', act, pause, play, onFinished });
}
