import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { EscalatingHypoxemiaProgress } from '../escalating-hypoxemia';
import { escalatingHypoxemiaDemonstrationStep } from './escalating-hypoxemia-demonstration';

export function useEscalatingHypoxemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: EscalatingHypoxemiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: escalatingHypoxemiaDemonstrationStep(patient),
    actionType: 'escalating-hypoxemia-response', act, pause, play, onFinished });
}
