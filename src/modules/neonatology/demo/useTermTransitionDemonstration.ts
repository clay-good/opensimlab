import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { TermTransitionProgress } from '../term-newborn-transition';
import { termTransitionDemonstrationStep } from './term-newborn-transition-demonstration';

export function useTermTransitionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: TermTransitionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: termTransitionDemonstrationStep(patient),
    actionType: 'term-newborn-transition-response', act, pause, play, onFinished });
}
