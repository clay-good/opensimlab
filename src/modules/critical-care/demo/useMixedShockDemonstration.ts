import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MixedShockProgress } from '../mixed-shock';
import { mixedShockDemonstrationStep } from './mixed-shock-demonstration';

export function useMixedShockDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: MixedShockProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: mixedShockDemonstrationStep(patient),
    actionType: 'mixed-shock-response', act, pause, play, onFinished });
}
