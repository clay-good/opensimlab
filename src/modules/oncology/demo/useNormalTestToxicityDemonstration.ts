import type { LearnerAction, NormalTestToxicitySnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { normalTestToxicityDemonstrationStep } from './normal-test-toxicity-demonstration';

export function useNormalTestToxicityDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NormalTestToxicitySnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: normalTestToxicityDemonstrationStep(patient),
    actionType: 'normal-test-toxicity-response', act, pause, play, onFinished });
}
