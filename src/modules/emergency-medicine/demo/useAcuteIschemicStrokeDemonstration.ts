import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AcuteIschemicStrokeProgress } from '../acute-ischemic-stroke';
import { acuteIschemicStrokeDemonstrationStep } from './acute-ischemic-stroke-demonstration';

export function useAcuteIschemicStrokeDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: AcuteIschemicStrokeProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: acuteIschemicStrokeDemonstrationStep(patient),
    actionType: 'acute-ischemic-stroke-response', act, pause, play, onFinished });
}
