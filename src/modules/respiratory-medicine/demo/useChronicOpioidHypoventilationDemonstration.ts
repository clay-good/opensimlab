import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { ChronicOpioidHypoventilationProgress } from '../chronic-opioid-related-hypoventilation-reassessment';
import { chronicOpioidHypoventilationDemonstrationStep } from './chronic-opioid-related-hypoventilation-reassessment-demonstration';

export function useChronicOpioidHypoventilationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: ChronicOpioidHypoventilationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: chronicOpioidHypoventilationDemonstrationStep(patient),
    actionType: 'chronic-opioid-related-hypoventilation-response', act, pause, play, onFinished });
}
