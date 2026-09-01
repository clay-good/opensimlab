import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MethanolProgress } from '../methanol-visual-acidosis-gaps';
import { methanolDemonstrationStep } from './methanol-visual-acidosis-gaps-demonstration';

export function useMethanolDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MethanolProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: methanolDemonstrationStep(patient),
    actionType: 'methanol-visual-acidosis-gaps-response', act, pause, play, onFinished });
}
