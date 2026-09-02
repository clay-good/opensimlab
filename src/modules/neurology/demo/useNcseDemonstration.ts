import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { NcseProgress } from '../nonconvulsive-status-epilepticus-recognition';
import { ncseDemonstrationStep } from './nonconvulsive-status-epilepticus-recognition-demonstration';

export function useNcseDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NcseProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: ncseDemonstrationStep(patient),
    actionType: 'nonconvulsive-status-epilepticus-recognition-response', act, pause, play, onFinished });
}
