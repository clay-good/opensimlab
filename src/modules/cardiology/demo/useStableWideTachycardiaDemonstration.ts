import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { StableWideTachycardiaProgress } from '../stable-wide-tachycardia';
import { stableWideTachycardiaDemonstrationStep } from './stable-wide-tachycardia-demonstration';

export function useStableWideTachycardiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: StableWideTachycardiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: stableWideTachycardiaDemonstrationStep(patient),
    actionType: 'stable-wide-tachycardia-response', act, pause, play, onFinished });
}
