import type { LearnerAction, SevereHypoglycemiaSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { hypoglycemiaDemonstrationStep } from './hypoglycemia-demonstration';

export function useHypoglycemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly patient?: SevereHypoglycemiaSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: hypoglycemiaDemonstrationStep(patient),
    actionType: 'severe-hypoglycemia-response', act, pause, play, onFinished });
}
