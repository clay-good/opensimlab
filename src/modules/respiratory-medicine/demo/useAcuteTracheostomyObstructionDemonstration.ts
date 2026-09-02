import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AcuteTracheostomyObstructionProgress } from '../acute-tracheostomy-obstruction';
import { acuteTracheostomyObstructionDemonstrationStep } from './acute-tracheostomy-obstruction-demonstration';

export function useAcuteTracheostomyObstructionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: AcuteTracheostomyObstructionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: acuteTracheostomyObstructionDemonstrationStep(patient),
    actionType: 'acute-tracheostomy-obstruction-response', act, pause, play, onFinished });
}
