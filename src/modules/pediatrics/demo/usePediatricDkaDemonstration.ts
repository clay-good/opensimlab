import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricDkaProgress } from '../pediatric-diabetic-ketoacidosis';
import { pediatricDkaDemonstrationStep } from './pediatric-dka-demonstration';

export function usePediatricDkaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PediatricDkaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: pediatricDkaDemonstrationStep(patient),
    actionType: 'pediatric-diabetic-ketoacidosis-response', act, pause, play, onFinished });
}
