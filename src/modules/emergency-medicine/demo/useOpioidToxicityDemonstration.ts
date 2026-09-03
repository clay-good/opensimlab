import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { OpioidToxicityProgress } from '../opioid-toxicity';
import { opioidToxicityDemonstrationStep } from './opioid-toxicity-demonstration';

export function useOpioidToxicityDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: OpioidToxicityProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: opioidToxicityDemonstrationStep(patient),
    actionType: 'opioid-toxicity-response', act, pause, play, onFinished });
}
