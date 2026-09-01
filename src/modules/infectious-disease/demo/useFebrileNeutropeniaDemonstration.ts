import type { FebrileNeutropeniaSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { febrileNeutropeniaDemonstrationStep } from './febrile-neutropenia-demonstration';

export function useFebrileNeutropeniaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: FebrileNeutropeniaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: febrileNeutropeniaDemonstrationStep(patient),
    actionType: 'febrile-neutropenia-response', act, pause, play, onFinished });
}
