import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricAnaphylaxisProgress } from '../pediatric-anaphylaxis';
import { pediatricAnaphylaxisDemonstrationStep } from './pediatric-anaphylaxis-demonstration';

export function usePediatricAnaphylaxisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PediatricAnaphylaxisProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pediatricAnaphylaxisDemonstrationStep(patient),
    actionType: 'pediatric-anaphylaxis-response', act, pause, play, onFinished });
}
