import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { HypothermiaRewarmingProgress } from './hypothermia-rewarming-demonstration';
import { hypothermiaRewarmingDemonstrationStep } from './hypothermia-rewarming-demonstration';

export function useHypothermiaRewarmingDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: HypothermiaRewarmingProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: hypothermiaRewarmingDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'thermal-response', act, pause, play, onFinished });
}
