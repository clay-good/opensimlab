import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CarbonMonoxideProgress } from '../carbon-monoxide-reassuring-monitor';
import { carbonMonoxideDemonstrationStep } from './carbon-monoxide-reassuring-monitor-demonstration';

export function useCarbonMonoxideDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: CarbonMonoxideProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: carbonMonoxideDemonstrationStep(patient),
    actionType: 'carbon-monoxide-reassuring-monitor-response', act, pause, play, onFinished });
}
