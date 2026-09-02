import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricFbaoProgress } from '../pediatric-foreign-body-airway-obstruction';
import { pediatricFbaoDemonstrationStep } from './pediatric-fbao-demonstration';

export function usePediatricFbaoDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PediatricFbaoProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: pediatricFbaoDemonstrationStep(patient),
    actionType: 'pediatric-foreign-body-airway-obstruction-response', act, pause, play, onFinished });
}
