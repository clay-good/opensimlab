import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MaternalArrestProgress } from '../maternal-cardiac-arrest-coordinated-response';
import { maternalArrestDemonstrationStep } from './maternal-cardiac-arrest-coordinated-response-demonstration';

export function useMaternalArrestDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MaternalArrestProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: maternalArrestDemonstrationStep(patient),
    actionType: 'maternal-cardiac-arrest-response', act, pause, play, onFinished });
}
