import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { IntracranialHemorrhageProgress } from '../intracranial-hemorrhage-deterioration';
import { intracranialHemorrhageDemonstrationStep } from './intracranial-hemorrhage-deterioration-demonstration';

export function useIntracranialHemorrhageDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: IntracranialHemorrhageProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: intracranialHemorrhageDemonstrationStep(patient),
    // The engine action type is shorter than the scenario id.
    actionType: 'intracranial-hemorrhage-response', act, pause, play, onFinished });
}
