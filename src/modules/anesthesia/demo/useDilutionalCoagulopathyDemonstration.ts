import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { DilutionalCoagulopathyProgress } from './dilutional-coagulopathy-demonstration';
import { dilutionalCoagulopathyDemonstrationStep } from './dilutional-coagulopathy-demonstration';

export function useDilutionalCoagulopathyDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: DilutionalCoagulopathyProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: dilutionalCoagulopathyDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'coagulation-labs', act, pause, play, onFinished });
}
