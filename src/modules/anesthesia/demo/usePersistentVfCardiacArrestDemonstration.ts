import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { PersistentVfCardiacArrestProgress } from './persistent-vf-cardiac-arrest-demonstration';
import { persistentVfCardiacArrestDemonstrationStep } from './persistent-vf-cardiac-arrest-demonstration';

export function usePersistentVfCardiacArrestDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PersistentVfCardiacArrestProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: persistentVfCardiacArrestDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'chest-compressions', act, pause, play, onFinished });
}
