import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { OxytocinTachysystoleProgress } from '../oxytocin-associated-uterine-tachysystole';
import { oxytocinTachysystoleDemonstrationStep } from './oxytocin-associated-uterine-tachysystole-demonstration';

export function useOxytocinTachysystoleDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: OxytocinTachysystoleProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: oxytocinTachysystoleDemonstrationStep(patient),
    actionType: 'oxytocin-associated-uterine-tachysystole-response', act, pause, play, onFinished });
}
