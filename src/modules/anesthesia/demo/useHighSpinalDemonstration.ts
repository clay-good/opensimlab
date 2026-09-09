import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { HighSpinalProgress } from './high-spinal-demonstration';
import { highSpinalDemonstrationStep } from './high-spinal-demonstration';

export function useHighSpinalDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: HighSpinalProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: highSpinalDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'ephedrine', act, pause, play, onFinished });
}
