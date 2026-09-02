import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CerebellarIchProgress } from '../spontaneous-cerebellar-intracerebral-hemorrhage';
import { cerebellarIchDemonstrationStep } from './spontaneous-cerebellar-intracerebral-hemorrhage-demonstration';

export function useCerebellarIchDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: CerebellarIchProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: cerebellarIchDemonstrationStep(patient),
    actionType: 'spontaneous-cerebellar-intracerebral-hemorrhage-response', act, pause, play, onFinished });
}
