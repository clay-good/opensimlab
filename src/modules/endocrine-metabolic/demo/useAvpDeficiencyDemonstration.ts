import type { LearnerAction, AvpDeficiencySnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { avpDeficiencyDemonstrationStep } from './avp-deficiency-demonstration';

export function useAvpDeficiencyDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly patient?: AvpDeficiencySnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: avpDeficiencyDemonstrationStep(patient),
    actionType: 'avp-deficiency-response', act, pause, play, onFinished });
}
