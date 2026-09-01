import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { IneffectiveVentilationProgress } from '../ineffective-ventilation-correction';
import { ineffectiveVentilationDemonstrationStep } from './ineffective-ventilation-correction-demonstration';

export function useIneffectiveVentilationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: IneffectiveVentilationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: ineffectiveVentilationDemonstrationStep(patient),
    actionType: 'ineffective-ventilation-correction-response', act, pause, play, onFinished });
}
