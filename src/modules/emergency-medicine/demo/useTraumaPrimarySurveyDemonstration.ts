import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { TraumaPrimarySurveyProgress } from '../trauma-primary-survey';
import { traumaPrimarySurveyDemonstrationStep } from './trauma-primary-survey-demonstration';

export function useTraumaPrimarySurveyDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: TraumaPrimarySurveyProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: traumaPrimarySurveyDemonstrationStep(patient),
    actionType: 'trauma-primary-survey-response', act, pause, play, onFinished });
}
