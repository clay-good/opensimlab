import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MeningitisProgress } from '../acute-bacterial-meningitis-first-hour';
import { meningitisDemonstrationStep } from './acute-bacterial-meningitis-first-hour-demonstration';

export function useMeningitisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MeningitisProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: meningitisDemonstrationStep(patient),
    actionType: 'acute-bacterial-meningitis-first-hour-response', act, pause, play, onFinished });
}
