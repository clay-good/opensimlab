import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import type { TubeMigrationProgress } from '../tube-migration';
import { tubeMigrationDemonstrationStep } from './tube-migration-demonstration';

export function useTubeMigrationDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean;
  readonly patient?: TubeMigrationProgress;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running,
    step: tubeMigrationDemonstrationStep(patient),
    actionType: 'endotracheal-tube-migration-response', act, pause, play, onFinished });
}
