import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { BronchiolitisProgress } from '../bronchiolitis';
import { bronchiolitisDemonstrationStep } from './bronchiolitis-demonstration';

export function useBronchiolitisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: BronchiolitisProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: bronchiolitisDemonstrationStep(patient),
    actionType: 'bronchiolitis-response', act, pause, play, onFinished });
}
