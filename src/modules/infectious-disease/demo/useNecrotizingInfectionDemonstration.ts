import type { NecrotizingInfectionSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { necrotizingInfectionDemonstrationStep } from './necrotizing-infection-demonstration';

export function useNecrotizingInfectionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NecrotizingInfectionSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: necrotizingInfectionDemonstrationStep(patient),
    actionType: 'necrotizing-infection-response', act, pause, play, onFinished });
}
