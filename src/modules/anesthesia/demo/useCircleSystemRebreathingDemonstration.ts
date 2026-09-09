import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { CircleSystemRebreathingProgress } from './circle-system-rebreathing-demonstration';
import { circleSystemRebreathingDemonstrationStep } from './circle-system-rebreathing-demonstration';

export function useCircleSystemRebreathingDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: CircleSystemRebreathingProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: circleSystemRebreathingDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'breathing-circuit', act, pause, play, onFinished });
}
