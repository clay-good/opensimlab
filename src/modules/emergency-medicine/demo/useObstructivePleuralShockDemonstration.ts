import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { ObstructivePleuralShockProgress } from '../obstructive-shock-tension-pneumothorax';
import { obstructivePleuralShockDemonstrationStep } from './obstructive-shock-tension-pneumothorax-demonstration';

export function useObstructivePleuralShockDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: ObstructivePleuralShockProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: obstructivePleuralShockDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'pneumothorax-response', act, pause, play, onFinished });
}
