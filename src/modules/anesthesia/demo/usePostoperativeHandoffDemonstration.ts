import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { PostoperativeHandoffProgress } from './postoperative-handoff-demonstration';
import { postoperativeHandoffDemonstrationStep } from './postoperative-handoff-demonstration';

export function usePostoperativeHandoffDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PostoperativeHandoffProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: postoperativeHandoffDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'postoperative-handoff-assessment', act, pause, play, onFinished });
}
