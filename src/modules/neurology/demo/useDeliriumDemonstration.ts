import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { DeliriumProgress } from '../acute-delirium-reversible-causes';
import { deliriumDemonstrationStep } from './acute-delirium-reversible-causes-demonstration';

export function useDeliriumDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: DeliriumProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: deliriumDemonstrationStep(patient),
    actionType: 'acute-delirium-reversible-causes-response', act, pause, play, onFinished });
}
