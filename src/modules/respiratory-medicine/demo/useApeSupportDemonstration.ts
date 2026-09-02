import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { ApeSupportProgress } from '../acute-pulmonary-edema-respiratory-support-reassessment';
import { apeSupportDemonstrationStep } from './acute-pulmonary-edema-respiratory-support-reassessment-demonstration';

export function useApeSupportDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: ApeSupportProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: apeSupportDemonstrationStep(patient),
    actionType: 'acute-pulmonary-edema-respiratory-support-response', act, pause, play, onFinished });
}
