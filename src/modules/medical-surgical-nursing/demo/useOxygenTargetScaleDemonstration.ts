import type { OxygenTargetScaleSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { oxygenTargetScaleDemonstrationStep } from './oxygen-target-scale-demonstration';

export function useOxygenTargetScaleDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: OxygenTargetScaleSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: oxygenTargetScaleDemonstrationStep(patient),
    actionType: 'oxygen-target-scale-response', act, pause, play, onFinished });
}
