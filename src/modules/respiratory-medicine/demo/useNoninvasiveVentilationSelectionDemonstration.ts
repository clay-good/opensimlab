import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { NoninvasiveVentilationSelectionProgress } from '../noninvasive-ventilation-selection';
import { noninvasiveVentilationSelectionDemonstrationStep } from './noninvasive-ventilation-selection-demonstration';

export function useNoninvasiveVentilationSelectionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NoninvasiveVentilationSelectionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: noninvasiveVentilationSelectionDemonstrationStep(patient),
    actionType: 'noninvasive-ventilation-selection-response', act, pause, play, onFinished });
}
