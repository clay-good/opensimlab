import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { EncephalitisProgress } from '../suspected-herpes-simplex-encephalitis';
import { encephalitisDemonstrationStep } from './suspected-herpes-simplex-encephalitis-demonstration';

export function useEncephalitisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: EncephalitisProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: encephalitisDemonstrationStep(patient),
    actionType: 'suspected-herpes-simplex-encephalitis-response', act, pause, play, onFinished });
}
