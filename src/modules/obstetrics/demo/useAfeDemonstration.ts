import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AfeProgress } from '../suspected-amniotic-fluid-embolism-pattern';
import { afeDemonstrationStep } from './suspected-amniotic-fluid-embolism-pattern-demonstration';

export function useAfeDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: AfeProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: afeDemonstrationStep(patient),
    actionType: 'suspected-amniotic-fluid-embolism-pattern-response', act, pause, play, onFinished });
}
