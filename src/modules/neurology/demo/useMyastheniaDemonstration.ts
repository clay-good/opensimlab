import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MyastheniaProgress } from '../myasthenic-crisis-escalation';
import { myastheniaDemonstrationStep } from './myasthenic-crisis-escalation-demonstration';

export function useMyastheniaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MyastheniaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: myastheniaDemonstrationStep(patient),
    actionType: 'myasthenic-crisis-escalation-response', act, pause, play, onFinished });
}
