import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { FailedIntubationProgress } from '../failed-obstetric-intubation-oxygenation-first';
import { failedIntubationDemonstrationStep } from './failed-obstetric-intubation-oxygenation-first-demonstration';

export function useFailedIntubationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: FailedIntubationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: failedIntubationDemonstrationStep(patient),
    actionType: 'failed-obstetric-intubation-oxygenation-first-response', act, pause, play, onFinished });
}
