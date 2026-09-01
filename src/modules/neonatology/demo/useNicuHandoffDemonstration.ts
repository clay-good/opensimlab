import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { NicuHandoffProgress } from '../delivery-room-to-nicu-handoff';
import { nicuHandoffDemonstrationStep } from './delivery-room-to-nicu-handoff-demonstration';

export function useNicuHandoffDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NicuHandoffProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: nicuHandoffDemonstrationStep(patient),
    actionType: 'delivery-room-to-nicu-handoff-response', act, pause, play, onFinished });
}
