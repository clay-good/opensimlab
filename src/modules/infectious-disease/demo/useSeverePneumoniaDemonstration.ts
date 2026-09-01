import type { SeverePneumoniaSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { severePneumoniaDemonstrationStep } from './severe-pneumonia-demonstration';

export function useSeverePneumoniaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: SeverePneumoniaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: severePneumoniaDemonstrationStep(patient),
    actionType: 'severe-pneumonia-response', act, pause, play, onFinished });
}
