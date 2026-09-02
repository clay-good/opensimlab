import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricDehydrationProgress } from '../pediatric-dehydration-with-hypovolemia';
import { pediatricDehydrationDemonstrationStep } from './pediatric-dehydration-demonstration';

export function usePediatricDehydrationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PediatricDehydrationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: pediatricDehydrationDemonstrationStep(patient),
    actionType: 'pediatric-dehydration-response', act, pause, play, onFinished });
}
