import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PediatricRespiratoryDistressProgress } from '../pediatric-respiratory-distress';
import { pediatricRespiratoryDistressDemonstrationStep } from './pediatric-respiratory-distress-demonstration';

export function usePediatricRespiratoryDistressDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: PediatricRespiratoryDistressProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: pediatricRespiratoryDistressDemonstrationStep(patient),
    actionType: 'pediatric-respiratory-distress-response', act, pause, play, onFinished });
}
