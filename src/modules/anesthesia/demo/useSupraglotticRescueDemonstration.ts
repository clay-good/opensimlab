import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { SupraglotticRescueProgress } from './supraglottic-rescue-demonstration';
import { supraglotticRescueDemonstrationStep } from './supraglottic-rescue-demonstration';

export function useSupraglotticRescueDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: SupraglotticRescueProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: supraglotticRescueDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'laryngoscopy', act, pause, play, onFinished });
}
