import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CopdExacerbationProgress } from '../copd-exacerbation';
import { copdExacerbationDemonstrationStep } from './copd-exacerbation-demonstration';

export function useCopdExacerbationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: CopdExacerbationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: copdExacerbationDemonstrationStep(patient),
    actionType: 'copd-exacerbation-response', act, pause, play, onFinished });
}
