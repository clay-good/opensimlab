import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { ObesityHypoventilationProgress } from '../obesity-hypoventilation-reassessment';
import { obesityHypoventilationDemonstrationStep } from './obesity-hypoventilation-reassessment-demonstration';

export function useObesityHypoventilationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: ObesityHypoventilationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: obesityHypoventilationDemonstrationStep(patient),
    actionType: 'obesity-hypoventilation-response', act, pause, play, onFinished });
}
