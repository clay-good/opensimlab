import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AtonyProgress } from '../postpartum-hemorrhage-uterine-atony';
import { atonyDemonstrationStep } from './postpartum-hemorrhage-uterine-atony-demonstration';

export function useAtonyDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: AtonyProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: atonyDemonstrationStep(patient),
    actionType: 'postpartum-hemorrhage-uterine-atony-response', act, pause, play, onFinished });
}
