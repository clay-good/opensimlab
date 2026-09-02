import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricBradycardicArrestProgress } from '../pediatric-bradycardic-arrest';
import { pediatricBradycardicArrestDemonstrationStep } from './pediatric-bradycardic-arrest-demonstration';

export function usePediatricBradycardicArrestDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PediatricBradycardicArrestProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pediatricBradycardicArrestDemonstrationStep(patient),
    actionType: 'pediatric-bradycardic-arrest-response', act, pause, play, onFinished });
}
