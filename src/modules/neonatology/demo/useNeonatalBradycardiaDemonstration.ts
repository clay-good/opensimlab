import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { NeonatalBradycardiaProgress } from '../neonatal-bradycardia';
import { neonatalBradycardiaDemonstrationStep } from './neonatal-bradycardia-demonstration';

export function useNeonatalBradycardiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NeonatalBradycardiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: neonatalBradycardiaDemonstrationStep(patient),
    actionType: 'neonatal-bradycardia-response', act, pause, play, onFinished });
}
