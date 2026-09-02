import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { StableChestPainProgress } from '../stable-chest-pain';
import { stableChestPainDemonstrationStep } from './stable-chest-pain-demonstration';

export function useStableChestPainDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: StableChestPainProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: stableChestPainDemonstrationStep(patient),
    actionType: 'stable-chest-pain-response', act, pause, play, onFinished });
}
