import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { IcuHandoffProgress } from '../icu-handoff';
import { icuHandoffDemonstrationStep } from './icu-handoff-demonstration';

export function useIcuHandoffDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: IcuHandoffProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: icuHandoffDemonstrationStep(patient),
    actionType: 'icu-hidden-deterioration-handoff-response', act, pause, play, onFinished });
}
