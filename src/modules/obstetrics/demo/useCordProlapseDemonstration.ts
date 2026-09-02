import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CordProlapseProgress } from '../umbilical-cord-prolapse-urgent-birth-coordination';
import { cordProlapseDemonstrationStep } from './umbilical-cord-prolapse-urgent-birth-coordination-demonstration';

export function useCordProlapseDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: CordProlapseProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: cordProlapseDemonstrationStep(patient),
    actionType: 'umbilical-cord-prolapse-urgent-birth-coordination-response', act, pause, play, onFinished });
}
