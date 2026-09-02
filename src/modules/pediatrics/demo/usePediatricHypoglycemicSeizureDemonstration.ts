import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricHypoglycemicSeizureProgress } from '../pediatric-hypoglycemic-seizure';
import { pediatricHypoglycemicSeizureDemonstrationStep } from './pediatric-hypoglycemic-seizure-demonstration';

export function usePediatricHypoglycemicSeizureDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PediatricHypoglycemicSeizureProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pediatricHypoglycemicSeizureDemonstrationStep(patient),
    actionType: 'pediatric-hypoglycemic-seizure-response', act, pause, play, onFinished });
}
