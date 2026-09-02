import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { DysreflexiaProgress } from '../autonomic-dysreflexia-authored-trigger';
import { dysreflexiaDemonstrationStep } from './autonomic-dysreflexia-authored-trigger-demonstration';

export function useDysreflexiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: DysreflexiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: dysreflexiaDemonstrationStep(patient),
    actionType: 'autonomic-dysreflexia-authored-trigger-response', act, pause, play, onFinished });
}
