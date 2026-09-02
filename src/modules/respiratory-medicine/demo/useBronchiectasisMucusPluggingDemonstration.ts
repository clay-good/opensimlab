import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { BronchiectasisMucusPluggingProgress } from '../bronchiectasis-mucus-plugging-reassessment';
import { bronchiectasisMucusPluggingDemonstrationStep } from './bronchiectasis-mucus-plugging-reassessment-demonstration';

export function useBronchiectasisMucusPluggingDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: BronchiectasisMucusPluggingProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: bronchiectasisMucusPluggingDemonstrationStep(patient),
    actionType: 'bronchiectasis-mucus-plugging-response', act, pause, play, onFinished });
}
