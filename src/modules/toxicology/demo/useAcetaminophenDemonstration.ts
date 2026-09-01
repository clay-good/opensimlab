import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AcetaminophenProgress } from '../acetaminophen-clock-and-nomogram';
import { acetaminophenDemonstrationStep } from './acetaminophen-clock-and-nomogram-demonstration';

export function useAcetaminophenDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: AcetaminophenProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: acetaminophenDemonstrationStep(patient),
    actionType: 'acetaminophen-clock-and-nomogram-response', act, pause, play, onFinished });
}
