import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { GbsProgress } from '../guillain-barre-respiratory-decline';
import { gbsDemonstrationStep } from './guillain-barre-respiratory-decline-demonstration';

export function useGbsDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: GbsProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: gbsDemonstrationStep(patient),
    actionType: 'guillain-barre-respiratory-decline-response', act, pause, play, onFinished });
}
