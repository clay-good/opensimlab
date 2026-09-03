import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { TranscutaneousPacingCaptureProgress } from '../transcutaneous-pacing-capture';
import { transcutaneousPacingCaptureDemonstrationStep } from './transcutaneous-pacing-capture-demonstration';

export function useTranscutaneousPacingCaptureDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: TranscutaneousPacingCaptureProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: transcutaneousPacingCaptureDemonstrationStep(patient),
    actionType: 'transcutaneous-pacing-capture-response', act, pause, play, onFinished });
}
