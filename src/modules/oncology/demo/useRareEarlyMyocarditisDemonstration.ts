import type { LearnerAction, RareEarlyMyocarditisSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { rareEarlyMyocarditisDemonstrationStep } from './rare-early-myocarditis-demonstration';

export function useRareEarlyMyocarditisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: RareEarlyMyocarditisSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: rareEarlyMyocarditisDemonstrationStep(patient),
    actionType: 'rare-early-myocarditis-response', act, pause, play, onFinished });
}
