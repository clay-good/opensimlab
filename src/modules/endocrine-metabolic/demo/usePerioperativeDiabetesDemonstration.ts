import type { LearnerAction, PerioperativeDiabetesSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { perioperativeDiabetesDemonstrationStep } from './perioperative-diabetes-demonstration';

export function usePerioperativeDiabetesDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly patient?: PerioperativeDiabetesSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: perioperativeDiabetesDemonstrationStep(patient),
    actionType: 'perioperative-diabetes-response', act, pause, play, onFinished });
}
