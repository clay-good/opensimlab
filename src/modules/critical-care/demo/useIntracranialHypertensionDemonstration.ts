import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { IntracranialHypertensionProgress } from '../intracranial-hypertension';
import { intracranialHypertensionDemonstrationStep } from './intracranial-hypertension-demonstration';

export function useIntracranialHypertensionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: IntracranialHypertensionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: intracranialHypertensionDemonstrationStep(patient),
    actionType: 'intracranial-hypertension-response', act, pause, play, onFinished });
}
