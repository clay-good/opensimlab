import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { ArterialTransducerProgress } from './arterial-transducer-demonstration';
import { arterialTransducerDemonstrationStep } from './arterial-transducer-demonstration';

export function useArterialTransducerDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: ArterialTransducerProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: arterialTransducerDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'arterial-line', act, pause, play, onFinished });
}
