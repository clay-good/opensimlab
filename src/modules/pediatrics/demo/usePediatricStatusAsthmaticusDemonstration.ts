import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricStatusAsthmaticusProgress } from '../pediatric-status-asthmaticus';
import { pediatricStatusAsthmaticusDemonstrationStep } from './pediatric-status-asthmaticus-demonstration';

export function usePediatricStatusAsthmaticusDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PediatricStatusAsthmaticusProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: pediatricStatusAsthmaticusDemonstrationStep(patient),
    actionType: 'pediatric-status-asthmaticus-response', act, pause, play, onFinished });
}
