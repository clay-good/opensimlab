import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { NeonatalSepsisProgress } from '../neonatal-sepsis';
import { neonatalSepsisDemonstrationStep } from './neonatal-sepsis-demonstration';

export function useNeonatalSepsisDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NeonatalSepsisProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: neonatalSepsisDemonstrationStep(patient),
    actionType: 'neonatal-sepsis-response', act, pause, play, onFinished });
}
