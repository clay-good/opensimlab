import type { LearnerAction, ThyroidStormSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { thyroidDemonstrationStep } from './thyroid-demonstration';

export function useThyroidDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly patient?: ThyroidStormSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: thyroidDemonstrationStep(patient),
    actionType: 'thyroid-storm-response', act, pause, play, onFinished });
}
