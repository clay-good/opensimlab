import type { LaboratoryTlsSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { laboratoryTlsDemonstrationStep } from './laboratory-tls-demonstration';

export function useLaboratoryTlsDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: LaboratoryTlsSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: laboratoryTlsDemonstrationStep(patient),
    actionType: 'laboratory-tls-response', act, pause, play, onFinished });
}
