import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { TricyclicProgress } from '../tricyclic-sodium-channel-cardiotoxicity';
import { tricyclicDemonstrationStep } from './tricyclic-sodium-channel-cardiotoxicity-demonstration';

export function useTricyclicDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: TricyclicProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: tricyclicDemonstrationStep(patient),
    actionType: 'tricyclic-sodium-channel-cardiotoxicity-response', act, pause, play, onFinished });
}
