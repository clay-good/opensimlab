import type { CountedRateSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { countedRateDemonstrationStep } from './counted-rate-demonstration';

export function useCountedRateDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: CountedRateSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: countedRateDemonstrationStep(patient),
    actionType: 'counted-rate-response', act, pause, play, onFinished });
}
