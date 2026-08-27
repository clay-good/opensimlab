import type { LearnerAction, HypocalcemiaSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { hypocalcemiaDemonstrationStep } from './hypocalcemia-demonstration';

export function useHypocalcemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly patient?: HypocalcemiaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: hypocalcemiaDemonstrationStep(patient),
    actionType: 'hypocalcemia-response', act, pause, play, onFinished });
}
