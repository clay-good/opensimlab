import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { VenousAirEmbolismProgress } from './venous-air-embolism-demonstration';
import { venousAirEmbolismDemonstrationStep } from './venous-air-embolism-demonstration';

export function useVenousAirEmbolismDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: VenousAirEmbolismProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: venousAirEmbolismDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'control-venous-air-entry', act, pause, play, onFinished });
}
