import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AcuteAorticSyndromeProgress } from '../acute-aortic-syndrome';
import { acuteAorticSyndromeDemonstrationStep } from './acute-aortic-syndrome-demonstration';

export function useAcuteAorticSyndromeDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: AcuteAorticSyndromeProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: acuteAorticSyndromeDemonstrationStep(patient),
    actionType: 'acute-aortic-syndrome-response', act, pause, play, onFinished });
}
