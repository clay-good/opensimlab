import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { OpioidVentilatoryImpairmentProgress } from './opioid-ventilatory-impairment-demonstration';
import { opioidVentilatoryImpairmentDemonstrationStep } from './opioid-ventilatory-impairment-demonstration';

export function useOpioidVentilatoryImpairmentDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: OpioidVentilatoryImpairmentProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: opioidVentilatoryImpairmentDemonstrationStep(patient),
    // Every beat carries its own dispatch, so this default is never reached.
    actionType: 'opioid-ventilatory-response', act, pause, play, onFinished });
}
