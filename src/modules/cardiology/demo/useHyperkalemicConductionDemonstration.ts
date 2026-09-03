import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { HyperkalemicConductionProgress } from '../hyperkalemic-conduction';
import { hyperkalemicConductionDemonstrationStep } from './hyperkalemic-conduction-demonstration';

export function useHyperkalemicConductionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: HyperkalemicConductionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: hyperkalemicConductionDemonstrationStep(patient),
    actionType: 'hyperkalemic-conduction-response', act, pause, play, onFinished });
}
