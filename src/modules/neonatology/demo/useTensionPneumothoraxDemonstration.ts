import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { TensionPneumothoraxProgress } from '../neonatal-tension-pneumothorax';
import { tensionPneumothoraxDemonstrationStep } from './neonatal-tension-pneumothorax-demonstration';

export function useTensionPneumothoraxDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: TensionPneumothoraxProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: tensionPneumothoraxDemonstrationStep(patient),
    actionType: 'neonatal-tension-pneumothorax-response', act, pause, play, onFinished });
}
