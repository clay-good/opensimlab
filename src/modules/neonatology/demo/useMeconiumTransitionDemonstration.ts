import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MeconiumTransitionProgress } from '../meconium-stained-transition';
import { meconiumTransitionDemonstrationStep } from './meconium-stained-transition-demonstration';

export function useMeconiumTransitionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MeconiumTransitionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: meconiumTransitionDemonstrationStep(patient),
    actionType: 'meconium-stained-transition-response', act, pause, play, onFinished });
}
