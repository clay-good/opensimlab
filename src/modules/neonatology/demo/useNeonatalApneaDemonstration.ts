import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { NeonatalApneaProgress } from '../neonatal-apnea';
import { neonatalApneaDemonstrationStep } from './neonatal-apnea-demonstration';

export function useNeonatalApneaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NeonatalApneaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: neonatalApneaDemonstrationStep(patient),
    actionType: 'neonatal-apnea-response', act, pause, play, onFinished });
}
