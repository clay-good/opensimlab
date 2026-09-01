import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { SerotoninProgress } from '../serotonin-toxicity-hyperthermia-clonus';
import { serotoninDemonstrationStep } from './serotonin-toxicity-hyperthermia-clonus-demonstration';

export function useSerotoninDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: SerotoninProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: serotoninDemonstrationStep(patient),
    actionType: 'serotonin-toxicity-hyperthermia-clonus-response', act, pause, play, onFinished });
}
