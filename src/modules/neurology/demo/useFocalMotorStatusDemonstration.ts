import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { FocalMotorStatusProgress } from '../focal-motor-status-epilepticus-escalation';
import { focalMotorStatusDemonstrationStep } from './focal-motor-status-epilepticus-escalation-demonstration';

export function useFocalMotorStatusDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: FocalMotorStatusProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: focalMotorStatusDemonstrationStep(patient),
    actionType: 'focal-motor-status-epilepticus-escalation-response', act, pause, play, onFinished });
}
