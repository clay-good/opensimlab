import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { SymptomaticBradycardiaProgress } from '../symptomatic-bradycardia';
import { symptomaticBradycardiaDemonstrationStep } from './symptomatic-bradycardia-demonstration';

export function useSymptomaticBradycardiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: SymptomaticBradycardiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: symptomaticBradycardiaDemonstrationStep(patient),
    actionType: 'symptomatic-bradycardia-response', act, pause, play, onFinished });
}
