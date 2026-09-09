import type { RisingRequirementSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { risingRequirementDemonstrationStep } from './rising-requirement-demonstration';

export function useRisingRequirementDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: RisingRequirementSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: risingRequirementDemonstrationStep(patient),
    actionType: 'rising-requirement-response', act, pause, play, onFinished });
}
