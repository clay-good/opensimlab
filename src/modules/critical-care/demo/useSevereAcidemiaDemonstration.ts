import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { SevereAcidemiaProgress } from '../severe-acidemia';
import { severeAcidemiaDemonstrationStep } from './severe-acidemia-demonstration';

export function useSevereAcidemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: SevereAcidemiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: severeAcidemiaDemonstrationStep(patient),
    actionType: 'severe-acidemia-response', act, pause, play, onFinished });
}
