import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { EclampsiaProgress } from '../eclampsia-first-seizure-response';
import { eclampsiaDemonstrationStep } from './eclampsia-first-seizure-response-demonstration';

export function useEclampsiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: EclampsiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: eclampsiaDemonstrationStep(patient),
    actionType: 'eclampsia-first-seizure-response', act, pause, play, onFinished });
}
