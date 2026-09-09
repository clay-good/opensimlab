import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { PneumothoraxProgress } from './pneumothorax-under-positive-pressure-demonstration';
import { pneumothoraxDemonstrationStep } from './pneumothorax-under-positive-pressure-demonstration';

export function usePneumothoraxDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PneumothoraxProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pneumothoraxDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'pneumothorax-response', act, pause, play, onFinished });
}
