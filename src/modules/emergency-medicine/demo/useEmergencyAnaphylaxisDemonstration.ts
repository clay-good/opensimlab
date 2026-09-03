import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { EmergencyAnaphylaxisProgress } from '../emergency-anaphylaxis';
import { emergencyAnaphylaxisDemonstrationStep } from './emergency-anaphylaxis-demonstration';

export function useEmergencyAnaphylaxisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: EmergencyAnaphylaxisProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: emergencyAnaphylaxisDemonstrationStep(patient),
    actionType: 'emergency-anaphylaxis-response', act, pause, play, onFinished });
}
