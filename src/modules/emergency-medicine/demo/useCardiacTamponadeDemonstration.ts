import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CardiacTamponadeProgress } from '../cardiac-tamponade';
import { cardiacTamponadeDemonstrationStep } from './cardiac-tamponade-demonstration';

export function useCardiacTamponadeDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: CardiacTamponadeProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: cardiacTamponadeDemonstrationStep(patient),
    // The engine action type here is `-assessment`, not `-response`.
    actionType: 'cardiac-tamponade-assessment', act, pause, play, onFinished });
}
