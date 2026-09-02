import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { AcuteSevereAsthmaProgress } from '../acute-severe-asthma';
import { acuteSevereAsthmaDemonstrationStep } from './acute-severe-asthma-demonstration';

export function useAcuteSevereAsthmaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: AcuteSevereAsthmaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: acuteSevereAsthmaDemonstrationStep(patient),
    actionType: 'acute-severe-asthma-response', act, pause, play, onFinished });
}
