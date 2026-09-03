import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MassivePeProgress } from '../massive-pe';
import { massivePeDemonstrationStep } from './massive-pe-demonstration';

export function useMassivePeDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: MassivePeProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: massivePeDemonstrationStep(patient),
    actionType: 'massive-pulmonary-embolism-response', act, pause, play, onFinished });
}
