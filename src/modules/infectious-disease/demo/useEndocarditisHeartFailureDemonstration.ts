import type { EndocarditisHeartFailureSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { endocarditisHeartFailureDemonstrationStep } from './endocarditis-heart-failure-demonstration';

export function useEndocarditisHeartFailureDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: EndocarditisHeartFailureSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: endocarditisHeartFailureDemonstrationStep(patient),
    actionType: 'endocarditis-heart-failure-response', act, pause, play, onFinished });
}
