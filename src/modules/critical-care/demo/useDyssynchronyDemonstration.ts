import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { DyssynchronyProgress } from '../dyssynchrony';
import { dyssynchronyDemonstrationStep } from './dyssynchrony-demonstration';

export function useDyssynchronyDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: DyssynchronyProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: dyssynchronyDemonstrationStep(patient),
    actionType: 'ventilator-dyssynchrony-response', act, pause, play, onFinished });
}
