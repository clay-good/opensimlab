import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MagnesiumToxicityProgress } from '../magnesium-sulfate-toxicity-recognition';
import { magnesiumToxicityDemonstrationStep } from './magnesium-sulfate-toxicity-recognition-demonstration';

export function useMagnesiumToxicityDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MagnesiumToxicityProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: magnesiumToxicityDemonstrationStep(patient),
    actionType: 'magnesium-sulfate-toxicity-recognition-response', act, pause, play, onFinished });
}
