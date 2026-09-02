import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { NstemiRiskProgress } from '../nstemi-risk';
import { nstemiRiskDemonstrationStep } from './nstemi-risk-demonstration';

export function useNstemiRiskDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: NstemiRiskProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: nstemiRiskDemonstrationStep(patient),
    actionType: 'nstemi-risk-response', act, pause, play, onFinished });
}
