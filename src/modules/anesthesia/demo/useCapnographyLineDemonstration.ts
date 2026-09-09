import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from './useDemonstration';
import { useObservedDemonstration } from './useObservedDemonstration';
import type { CapnographyLineProgress } from './capnography-line-demonstration';
import { capnographyLineDemonstrationStep } from './capnography-line-demonstration';

export function useCapnographyLineDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: CapnographyLineProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: capnographyLineDemonstrationStep(patient),
    // Every dispatching beat carries its own action, so this is never reached.
    actionType: 'capnography-line', act, pause, play, onFinished });
}
