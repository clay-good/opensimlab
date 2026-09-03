import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { SepticShockResuscitationProgress } from '../septic-shock-resuscitation';
import { septicShockResuscitationDemonstrationStep } from './septic-shock-resuscitation-demonstration';

export function useSepticShockResuscitationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: SepticShockResuscitationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: septicShockResuscitationDemonstrationStep(patient),
    actionType: 'septic-shock-resuscitation-response', act, pause, play, onFinished });
}
