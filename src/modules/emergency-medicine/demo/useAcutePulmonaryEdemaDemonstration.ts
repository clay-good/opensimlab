import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AcutePulmonaryEdemaProgress } from '../acute-pulmonary-edema';
import { acutePulmonaryEdemaDemonstrationStep } from './acute-pulmonary-edema-demonstration';

export function useAcutePulmonaryEdemaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: AcutePulmonaryEdemaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: acutePulmonaryEdemaDemonstrationStep(patient),
    actionType: 'acute-pulmonary-edema-response', act, pause, play, onFinished });
}
