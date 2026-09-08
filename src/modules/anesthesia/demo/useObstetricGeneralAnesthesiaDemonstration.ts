import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { ObstetricGeneralAnesthesiaProgress } from './obstetric-general-anesthesia-demonstration';
import { obstetricGeneralAnesthesiaDemonstrationStep } from './obstetric-general-anesthesia-demonstration';

export function useObstetricGeneralAnesthesiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: ObstetricGeneralAnesthesiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: obstetricGeneralAnesthesiaDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'ventilator', act, pause, play, onFinished });
}
