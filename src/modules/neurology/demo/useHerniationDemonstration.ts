import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { HerniationProgress } from '../acute-transtentorial-herniation-pattern';
import { herniationDemonstrationStep } from './acute-transtentorial-herniation-pattern-demonstration';

export function useHerniationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: HerniationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: herniationDemonstrationStep(patient),
    actionType: 'acute-transtentorial-herniation-pattern-response', act, pause, play, onFinished });
}
