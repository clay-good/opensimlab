import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AdultAsthmaProgress } from '../adult-asthma';
import { adultAsthmaDemonstrationStep } from './adult-asthma-demonstration';

export function useAdultAsthmaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: AdultAsthmaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: adultAsthmaDemonstrationStep(patient),
    actionType: 'adult-asthma-response', act, pause, play, onFinished });
}
