import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PulseOximeterArtifactProgress } from '../pulse-oximeter-artifact';
import { pulseOximeterArtifactDemonstrationStep } from './pulse-oximeter-artifact-demonstration';

export function usePulseOximeterArtifactDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PulseOximeterArtifactProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pulseOximeterArtifactDemonstrationStep(patient),
    actionType: 'pulse-oximeter-artifact-response', act, pause, play, onFinished });
}
