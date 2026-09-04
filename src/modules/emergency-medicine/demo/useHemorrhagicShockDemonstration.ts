import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { HemorrhagicShockProgress } from '../hemorrhagic-shock';
import { hemorrhagicShockDemonstrationStep } from './hemorrhagic-shock-demonstration';

export function useHemorrhagicShockDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: HemorrhagicShockProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: hemorrhagicShockDemonstrationStep(patient),
    actionType: 'hemorrhagic-shock-assessment', act, pause, play, onFinished });
}
