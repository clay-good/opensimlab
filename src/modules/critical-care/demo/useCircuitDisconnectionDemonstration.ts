import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { CircuitDisconnectionProgress } from '../circuit-disconnection';
import { circuitDisconnectionDemonstrationStep } from './circuit-disconnection-demonstration';

export function useCircuitDisconnectionDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: CircuitDisconnectionProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: circuitDisconnectionDemonstrationStep(patient),
    actionType: 'ventilator-circuit-disconnection-response', act, pause, play, onFinished });
}
