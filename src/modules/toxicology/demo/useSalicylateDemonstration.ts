import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { SalicylateProgress } from '../salicylate-falling-number';
import { salicylateDemonstrationStep } from './salicylate-falling-number-demonstration';

export function useSalicylateDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: SalicylateProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: salicylateDemonstrationStep(patient),
    actionType: 'salicylate-falling-number-response', act, pause, play, onFinished });
}
