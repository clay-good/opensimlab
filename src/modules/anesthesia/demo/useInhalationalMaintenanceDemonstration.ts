import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { InhalationalMaintenanceProgress } from './inhalational-maintenance-demonstration';
import { inhalationalMaintenanceDemonstrationStep } from './inhalational-maintenance-demonstration';

export function useInhalationalMaintenanceDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: InhalationalMaintenanceProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: inhalationalMaintenanceDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'ventilator', act, pause, play, onFinished });
}
