import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CardiogenicShockProgress } from '../cardiogenic-shock';
import { cardiogenicShockDemonstrationStep } from './cardiogenic-shock-demonstration';

export function useCardiogenicShockDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: CardiogenicShockProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: cardiogenicShockDemonstrationStep(patient),
    actionType: 'cardiogenic-shock-response', act, pause, play, onFinished });
}
