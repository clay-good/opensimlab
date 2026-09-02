import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MaternalSepsisProgress } from '../maternal-sepsis-postpartum-deterioration';
import { maternalSepsisDemonstrationStep } from './maternal-sepsis-postpartum-deterioration-demonstration';

export function useMaternalSepsisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MaternalSepsisProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: maternalSepsisDemonstrationStep(patient),
    actionType: 'maternal-sepsis-postpartum-deterioration-response', act, pause, play, onFinished });
}
