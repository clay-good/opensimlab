import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { PerioperativeHyperglycemiaProgress } from './perioperative-hyperglycemia-demonstration';
import { perioperativeHyperglycemiaDemonstrationStep } from './perioperative-hyperglycemia-demonstration';

export function usePerioperativeHyperglycemiaDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: PerioperativeHyperglycemiaProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: perioperativeHyperglycemiaDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'glycemic-response', act, pause, play, onFinished });
}
