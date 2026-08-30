import type { LearnerAction, SilentInteractionSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { silentInteractionDemonstrationStep } from './silent-interaction-demonstration';

export function useSilentInteractionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: SilentInteractionSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: silentInteractionDemonstrationStep(patient),
    actionType: 'silent-interaction-response', act, pause, play, onFinished });
}
