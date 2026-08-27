import type { LearnerAction, HypercalcemiaSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { hypercalcemiaDemonstrationStep } from './hypercalcemia-demonstration';

export function useHypercalcemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly patient?: HypercalcemiaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: hypercalcemiaDemonstrationStep(patient),
    actionType: 'hypercalcemia-response', act, pause, play, onFinished });
}
