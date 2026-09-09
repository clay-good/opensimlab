import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { PacemakerAndCauteryPlanningProgress } from './pacemaker-and-cautery-planning-demonstration';
import { pacemakerAndCauteryPlanningDemonstrationStep } from './pacemaker-and-cautery-planning-demonstration';

export function usePacemakerAndCauteryPlanningDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PacemakerAndCauteryPlanningProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pacemakerAndCauteryPlanningDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'cied-planning-assessment', act, pause, play, onFinished });
}
