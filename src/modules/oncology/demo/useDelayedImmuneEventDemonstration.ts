import type { DelayedImmuneEventSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { delayedImmuneEventDemonstrationStep } from './delayed-immune-event-demonstration';

export function useDelayedImmuneEventDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: DelayedImmuneEventSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: delayedImmuneEventDemonstrationStep(patient),
    actionType: 'delayed-immune-event-response', act, pause, play, onFinished });
}
