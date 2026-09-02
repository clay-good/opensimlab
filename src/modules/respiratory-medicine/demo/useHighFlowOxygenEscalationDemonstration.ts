import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { HighFlowOxygenEscalationProgress } from '../high-flow-nasal-oxygen-escalation';
import { highFlowOxygenEscalationDemonstrationStep } from './high-flow-nasal-oxygen-escalation-demonstration';

export function useHighFlowOxygenEscalationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: HighFlowOxygenEscalationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: highFlowOxygenEscalationDemonstrationStep(patient),
    actionType: 'high-flow-nasal-oxygen-escalation-response', act, pause, play, onFinished });
}
