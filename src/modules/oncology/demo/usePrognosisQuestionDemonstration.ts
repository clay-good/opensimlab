import type { LearnerAction, PrognosisQuestionSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { prognosisQuestionDemonstrationStep } from './prognosis-question-demonstration';

export function usePrognosisQuestionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PrognosisQuestionSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: prognosisQuestionDemonstrationStep(patient),
    actionType: 'prognosis-question-response', act, pause, play, onFinished });
}
