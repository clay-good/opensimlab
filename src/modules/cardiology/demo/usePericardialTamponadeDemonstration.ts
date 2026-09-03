import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { PericardialTamponadeProgress } from '../pericardial-tamponade';
import { pericardialTamponadeDemonstrationStep } from './pericardial-tamponade-demonstration';

export function usePericardialTamponadeDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PericardialTamponadeProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: pericardialTamponadeDemonstrationStep(patient),
    actionType: 'pericardial-tamponade-response', act, pause, play, onFinished });
}
