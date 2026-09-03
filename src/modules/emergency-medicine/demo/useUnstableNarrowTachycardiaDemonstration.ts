import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { UnstableNarrowTachycardiaProgress } from '../unstable-narrow-complex-tachycardia';
import { unstableNarrowTachycardiaDemonstrationStep } from './unstable-narrow-complex-tachycardia-demonstration';

export function useUnstableNarrowTachycardiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: UnstableNarrowTachycardiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: unstableNarrowTachycardiaDemonstrationStep(patient),
    // The engine action type is shorter than the scenario id.
    actionType: 'unstable-narrow-tachycardia-response', act, pause, play, onFinished });
}
