import type { IncidentalClotSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { incidentalClotDemonstrationStep } from './incidental-clot-demonstration';

export function useIncidentalClotDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: IncidentalClotSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: incidentalClotDemonstrationStep(patient),
    actionType: 'incidental-clot-response', act, pause, play, onFinished });
}
