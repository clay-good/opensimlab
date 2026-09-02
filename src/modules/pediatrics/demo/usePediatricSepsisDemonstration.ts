import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricSepsisProgress } from '../pediatric-sepsis';
import { pediatricSepsisDemonstrationStep } from './pediatric-sepsis-demonstration';

export function usePediatricSepsisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PediatricSepsisProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: pediatricSepsisDemonstrationStep(patient),
    actionType: 'pediatric-sepsis-response', act, pause, play, onFinished });
}
