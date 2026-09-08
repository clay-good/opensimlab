import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { EmergenceResidualBlockadeProgress } from './emergence-residual-blockade-demonstration';
import { emergenceResidualBlockadeDemonstrationStep } from './emergence-residual-blockade-demonstration';

export function useEmergenceResidualBlockadeDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: EmergenceResidualBlockadeProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: emergenceResidualBlockadeDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'emergence-residual-block-assessment', act, pause, play, onFinished });
}
