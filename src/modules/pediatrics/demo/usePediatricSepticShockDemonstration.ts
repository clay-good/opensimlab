import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricSepticShockProgress } from '../pediatric-septic-shock';
import { pediatricSepticShockDemonstrationStep } from './pediatric-septic-shock-demonstration';

export function usePediatricSepticShockDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PediatricSepticShockProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: pediatricSepticShockDemonstrationStep(patient),
    actionType: 'pediatric-septic-shock-response', act, pause, play, onFinished });
}
