import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { SpontaneousBreathingTrialProgress } from '../spontaneous-breathing-trial';
import { spontaneousBreathingTrialDemonstrationStep } from './spontaneous-breathing-trial-demonstration';

export function useSpontaneousBreathingTrialDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: SpontaneousBreathingTrialProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: spontaneousBreathingTrialDemonstrationStep(patient),
    actionType: 'spontaneous-breathing-trial-response', act, pause, play, onFinished });
}
