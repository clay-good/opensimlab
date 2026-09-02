import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { ClinicStemiProgress } from '../clinic-stemi';
import { clinicStemiDemonstrationStep } from './clinic-stemi-demonstration';

export function useClinicStemiDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: ClinicStemiProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: clinicStemiDemonstrationStep(patient),
    actionType: 'clinic-stemi-response', act, pause, play, onFinished });
}
