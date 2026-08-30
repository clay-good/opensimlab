import type { InheritedUrgencySnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { inheritedUrgencyDemonstrationStep } from './inherited-urgency-demonstration';

export function useInheritedUrgencyDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: InheritedUrgencySnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: inheritedUrgencyDemonstrationStep(patient),
    actionType: 'inherited-urgency-response', act, pause, play, onFinished });
}
