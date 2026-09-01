import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { BetaBlockerProgress } from '../beta-blocker-cardiogenic-shock';
import { betaBlockerDemonstrationStep } from './beta-blocker-cardiogenic-shock-demonstration';

export function useBetaBlockerDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: BetaBlockerProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: betaBlockerDemonstrationStep(patient),
    actionType: 'beta-blocker-cardiogenic-shock-response', act, pause, play, onFinished });
}
