import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { UterineRuptureProgress } from '../suspected-uterine-rupture-recognition';
import { uterineRuptureDemonstrationStep } from './suspected-uterine-rupture-recognition-demonstration';

export function useUterineRuptureDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: UterineRuptureProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: uterineRuptureDemonstrationStep(patient),
    actionType: 'suspected-uterine-rupture-recognition-response', act, pause, play, onFinished });
}
