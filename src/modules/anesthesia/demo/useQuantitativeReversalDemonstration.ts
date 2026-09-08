import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { QuantitativeReversalProgress } from './quantitative-reversal-demonstration';
import { quantitativeReversalDemonstrationStep } from './quantitative-reversal-demonstration';

export function useQuantitativeReversalDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: QuantitativeReversalProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: quantitativeReversalDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'bolus', act, pause, play, onFinished });
}
