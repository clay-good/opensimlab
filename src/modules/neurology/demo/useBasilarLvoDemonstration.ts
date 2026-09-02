import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { BasilarLvoProgress } from '../basilar-artery-occlusion-escalation';
import { basilarLvoDemonstrationStep } from './basilar-artery-occlusion-escalation-demonstration';

export function useBasilarLvoDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: BasilarLvoProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: basilarLvoDemonstrationStep(patient),
    actionType: 'basilar-artery-occlusion-escalation-response', act, pause, play, onFinished });
}
