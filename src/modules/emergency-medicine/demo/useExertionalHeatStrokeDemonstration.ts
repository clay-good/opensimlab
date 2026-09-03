import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { ExertionalHeatStrokeProgress } from '../exertional-heat-stroke';
import { exertionalHeatStrokeDemonstrationStep } from './exertional-heat-stroke-demonstration';

export function useExertionalHeatStrokeDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: ExertionalHeatStrokeProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: exertionalHeatStrokeDemonstrationStep(patient),
    // The engine action type is shorter than the scenario id.
    actionType: 'heat-stroke-response', act, pause, play, onFinished });
}
