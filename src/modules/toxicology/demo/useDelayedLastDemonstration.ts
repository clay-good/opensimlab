import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { DelayedLastProgress } from '../delayed-local-anesthetic-cns-cardiac-toxicity';
import { delayedLastDemonstrationStep } from './delayed-local-anesthetic-cns-cardiac-toxicity-demonstration';

export function useDelayedLastDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: DelayedLastProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: delayedLastDemonstrationStep(patient),
    actionType: 'delayed-local-anesthetic-cns-cardiac-toxicity-response', act, pause, play, onFinished });
}
