import type { LearnerAction, LoweringTheCountSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { loweringTheCountDemonstrationStep } from './lowering-the-count-demonstration';

export function useLoweringTheCountDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: LoweringTheCountSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: loweringTheCountDemonstrationStep(patient),
    actionType: 'lowering-the-count-response', act, pause, play, onFinished });
}
