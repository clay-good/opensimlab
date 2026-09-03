import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { StatusEpilepticusProgress } from '../status-epilepticus';
import { statusEpilepticusDemonstrationStep } from './status-epilepticus-demonstration';

export function useStatusEpilepticusDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: StatusEpilepticusProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: statusEpilepticusDemonstrationStep(patient),
    actionType: 'critical-care-status-epilepticus-response', act, pause, play, onFinished });
}
