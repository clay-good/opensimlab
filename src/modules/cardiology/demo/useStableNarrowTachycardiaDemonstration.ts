import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { StableNarrowTachycardiaProgress } from '../stable-narrow-tachycardia';
import { stableNarrowTachycardiaDemonstrationStep } from './stable-narrow-tachycardia-demonstration';

export function useStableNarrowTachycardiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: StableNarrowTachycardiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: stableNarrowTachycardiaDemonstrationStep(patient),
    actionType: 'stable-narrow-tachycardia-response', act, pause, play, onFinished });
}
