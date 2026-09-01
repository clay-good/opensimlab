import type { MeningococcalSepsisSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { meningococcalSepsisDemonstrationStep } from './meningococcal-sepsis-demonstration';

export function useMeningococcalSepsisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MeningococcalSepsisSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: meningococcalSepsisDemonstrationStep(patient),
    actionType: 'meningococcal-sepsis-response', act, pause, play, onFinished });
}
