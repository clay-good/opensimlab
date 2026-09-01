import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { NeonatalHypoglycemiaProgress } from '../neonatal-hypoglycemia';
import { neonatalHypoglycemiaDemonstrationStep } from './neonatal-hypoglycemia-demonstration';

export function useNeonatalHypoglycemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NeonatalHypoglycemiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: neonatalHypoglycemiaDemonstrationStep(patient),
    actionType: 'neonatal-hypoglycemia-response', act, pause, play, onFinished });
}
