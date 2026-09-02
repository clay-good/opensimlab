import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MinorStrokeProgress } from '../minor-nondisabling-acute-ischemic-stroke';
import { minorStrokeDemonstrationStep } from './minor-nondisabling-acute-ischemic-stroke-demonstration';

export function useMinorStrokeDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MinorStrokeProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: minorStrokeDemonstrationStep(patient),
    actionType: 'minor-nondisabling-acute-ischemic-stroke-response', act, pause, play, onFinished });
}
