import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { HighNeuraxialProgress } from '../high-neuraxial-block-obstetric-coordination';
import { highNeuraxialDemonstrationStep } from './high-neuraxial-block-obstetric-coordination-demonstration';

export function useHighNeuraxialDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: HighNeuraxialProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: highNeuraxialDemonstrationStep(patient),
    actionType: 'high-neuraxial-block-obstetric-coordination-response', act, pause, play, onFinished });
}
