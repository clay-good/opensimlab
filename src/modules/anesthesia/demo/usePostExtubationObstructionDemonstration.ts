import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { PostExtubationObstructionProgress } from './post-extubation-obstruction-demonstration';
import { postExtubationObstructionDemonstrationStep } from './post-extubation-obstruction-demonstration';

export function usePostExtubationObstructionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PostExtubationObstructionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: postExtubationObstructionDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'airway-maneuver', act, pause, play, onFinished });
}
