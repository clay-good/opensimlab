import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { UndifferentiatedShockProgress } from '../undifferentiated-shock';
import { undifferentiatedShockDemonstrationStep } from './undifferentiated-shock-demonstration';

export function useUndifferentiatedShockDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: UndifferentiatedShockProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: undifferentiatedShockDemonstrationStep(patient),
    actionType: 'undifferentiated-shock-assessment', act, pause, play, onFinished });
}
