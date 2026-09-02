import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PostpartumPreeclampsiaProgress } from '../postpartum-severe-preeclampsia-warning-signs';
import { postpartumPreeclampsiaDemonstrationStep } from './postpartum-severe-preeclampsia-warning-signs-demonstration';

export function usePostpartumPreeclampsiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PostpartumPreeclampsiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: postpartumPreeclampsiaDemonstrationStep(patient),
    actionType: 'postpartum-severe-preeclampsia-warning-signs-response', act, pause, play, onFinished });
}
