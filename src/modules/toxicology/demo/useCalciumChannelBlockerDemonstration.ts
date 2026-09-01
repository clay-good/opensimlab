import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CalciumChannelBlockerProgress } from '../calcium-channel-blocker-shock';
import { calciumChannelBlockerDemonstrationStep } from './calcium-channel-blocker-shock-demonstration';

export function useCalciumChannelBlockerDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: CalciumChannelBlockerProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: calciumChannelBlockerDemonstrationStep(patient),
    actionType: 'calcium-channel-blocker-shock-response', act, pause, play, onFinished });
}
