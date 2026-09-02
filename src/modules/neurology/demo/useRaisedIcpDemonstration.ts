import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { RaisedIcpProgress } from '../raised-intracranial-pressure-visual-threat';
import { raisedIcpDemonstrationStep } from './raised-intracranial-pressure-visual-threat-demonstration';

export function useRaisedIcpDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: RaisedIcpProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: raisedIcpDemonstrationStep(patient),
    actionType: 'raised-intracranial-pressure-visual-threat-response', act, pause, play, onFinished });
}
