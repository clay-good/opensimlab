import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { RapidSequenceInductionProgress } from './rapid-sequence-induction-demonstration';
import { rapidSequenceInductionDemonstrationStep } from './rapid-sequence-induction-demonstration';

export function useRapidSequenceInductionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: RapidSequenceInductionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: rapidSequenceInductionDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'ventilator', act, pause, play, onFinished });
}
