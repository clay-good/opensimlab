import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { ArdsLungProtectiveProgress } from '../ards-lung-protective';
import { ardsLungProtectiveDemonstrationStep } from './ards-lung-protective-demonstration';

export function useArdsLungProtectiveDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: ArdsLungProtectiveProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: ardsLungProtectiveDemonstrationStep(patient),
    actionType: 'ards-lung-protective-response', act, pause, play, onFinished });
}
