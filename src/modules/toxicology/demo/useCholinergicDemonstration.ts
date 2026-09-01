import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CholinergicProgress } from '../cholinergic-pesticide-respiratory-failure';
import { cholinergicDemonstrationStep } from './cholinergic-pesticide-respiratory-failure-demonstration';

export function useCholinergicDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: CholinergicProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: cholinergicDemonstrationStep(patient),
    actionType: 'cholinergic-pesticide-respiratory-failure-response', act, pause, play, onFinished });
}
