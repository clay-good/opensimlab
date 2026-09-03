import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { DiabeticKetoacidosisProgress } from '../diabetic-ketoacidosis';
import { diabeticKetoacidosisDemonstrationStep } from './diabetic-ketoacidosis-demonstration';

export function useDiabeticKetoacidosisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: DiabeticKetoacidosisProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: diabeticKetoacidosisDemonstrationStep(patient),
    actionType: 'diabetic-ketoacidosis-response', act, pause, play, onFinished });
}
