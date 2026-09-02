import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { ShoulderDystociaProgress } from '../shoulder-dystocia-cognitive-sequence';
import { shoulderDystociaDemonstrationStep } from './shoulder-dystocia-cognitive-sequence-demonstration';

export function useShoulderDystociaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: ShoulderDystociaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: shoulderDystociaDemonstrationStep(patient),
    actionType: 'shoulder-dystocia-cognitive-sequence-response', act, pause, play, onFinished });
}
