import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { ThermoregulationProgress } from '../thermoregulation-failure';
import { thermoregulationDemonstrationStep } from './thermoregulation-failure-demonstration';

export function useThermoregulationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: ThermoregulationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: thermoregulationDemonstrationStep(patient),
    actionType: 'neonatal-thermoregulation-response', act, pause, play, onFinished });
}
