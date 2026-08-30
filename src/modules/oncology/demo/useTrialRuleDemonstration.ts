import type { LearnerAction, TrialRuleSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { trialRuleDemonstrationStep } from './trial-rule-demonstration';

export function useTrialRuleDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: TrialRuleSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: trialRuleDemonstrationStep(patient),
    actionType: 'trial-rule-response', act, pause, play, onFinished });
}
