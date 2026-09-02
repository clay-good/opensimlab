import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { MaternalNeonatalHandoffProgress } from '../maternal-to-neonatal-resuscitation-handoff';
import { maternalNeonatalHandoffDemonstrationStep } from './maternal-to-neonatal-resuscitation-handoff-demonstration';

export function useMaternalNeonatalHandoffDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: MaternalNeonatalHandoffProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: maternalNeonatalHandoffDemonstrationStep(patient),
    actionType: 'maternal-to-neonatal-resuscitation-handoff-response', act, pause, play, onFinished });
}
