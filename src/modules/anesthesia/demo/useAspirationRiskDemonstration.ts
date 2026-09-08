import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { AspirationRiskProgress } from './aspiration-risk-demonstration';
import { aspirationRiskDemonstrationStep } from './aspiration-risk-demonstration';

export function useAspirationRiskDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: AspirationRiskProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: aspirationRiskDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'aspiration-risk-assessment', act, pause, play, onFinished });
}
