import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricInjurySafeguardingProgress } from '../pediatric-injury-safeguarding';
import { pediatricInjurySafeguardingDemonstrationStep } from './pediatric-injury-safeguarding-demonstration';

export function usePediatricInjurySafeguardingDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PediatricInjurySafeguardingProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pediatricInjurySafeguardingDemonstrationStep(patient),
    actionType: 'pediatric-injury-safeguarding-escalation-response', act, pause, play, onFinished });
}
