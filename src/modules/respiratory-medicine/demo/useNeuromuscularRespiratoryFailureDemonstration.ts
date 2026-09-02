import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { NeuromuscularRespiratoryFailureProgress } from '../neuromuscular-respiratory-failure-reassessment';
import { neuromuscularRespiratoryFailureDemonstrationStep } from './neuromuscular-respiratory-failure-reassessment-demonstration';

export function useNeuromuscularRespiratoryFailureDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NeuromuscularRespiratoryFailureProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: neuromuscularRespiratoryFailureDemonstrationStep(patient),
    actionType: 'neuromuscular-respiratory-failure-response', act, pause, play, onFinished });
}
