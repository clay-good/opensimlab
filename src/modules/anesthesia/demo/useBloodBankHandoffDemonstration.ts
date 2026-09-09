import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { BloodBankHandoffProgress } from './blood-bank-handoff-demonstration';
import { bloodBankHandoffDemonstrationStep } from './blood-bank-handoff-demonstration';

export function useBloodBankHandoffDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: BloodBankHandoffProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: bloodBankHandoffDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'blood-bank-request', act, pause, play, onFinished });
}
