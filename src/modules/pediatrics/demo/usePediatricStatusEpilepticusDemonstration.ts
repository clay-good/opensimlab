import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricStatusEpilepticusProgress } from '../pediatric-status-epilepticus';
import { pediatricStatusEpilepticusDemonstrationStep } from './pediatric-status-epilepticus-demonstration';

export function usePediatricStatusEpilepticusDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PediatricStatusEpilepticusProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pediatricStatusEpilepticusDemonstrationStep(patient),
    actionType: 'pediatric-status-epilepticus-response', act, pause, play, onFinished });
}
