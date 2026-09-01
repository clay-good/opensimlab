import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MethemoglobinemiaProgress } from '../methemoglobinemia-saturation-gap';
import { methemoglobinemiaDemonstrationStep } from './methemoglobinemia-saturation-gap-demonstration';

export function useMethemoglobinemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MethemoglobinemiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: methemoglobinemiaDemonstrationStep(patient),
    actionType: 'methemoglobinemia-saturation-gap-response', act, pause, play, onFinished });
}
