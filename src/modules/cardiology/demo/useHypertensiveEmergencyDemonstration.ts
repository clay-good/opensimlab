import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { HypertensiveEmergencyProgress } from '../hypertensive-emergency';
import { hypertensiveEmergencyDemonstrationStep } from './hypertensive-emergency-demonstration';

export function useHypertensiveEmergencyDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: HypertensiveEmergencyProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: hypertensiveEmergencyDemonstrationStep(patient),
    actionType: 'hypertensive-emergency-response', act, pause, play, onFinished });
}
