import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MucusPluggingProgress } from '../mucus-plugging';
import { mucusPluggingDemonstrationStep } from './mucus-plugging-demonstration';

export function useMucusPluggingDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: MucusPluggingProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: mucusPluggingDemonstrationStep(patient),
    actionType: 'mucus-plugging-response', act, pause, play, onFinished });
}
