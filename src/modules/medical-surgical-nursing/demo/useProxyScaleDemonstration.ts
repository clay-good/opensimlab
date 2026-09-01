import type { ProxyScaleSnapshot, LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { useObservedDemonstration } from '@anesthesia/demo/useObservedDemonstration';
import { proxyScaleDemonstrationStep } from './proxy-scale-demonstration';

export function useProxyScaleDemonstration({ active, running, patient, act, pause, play, onFinished }: {
  readonly active: boolean; readonly running: boolean; readonly patient?: ProxyScaleSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void; readonly play: () => void; readonly onFinished: () => void;
}): DemonstrationController {
  return useObservedDemonstration({ active, running, step: proxyScaleDemonstrationStep(patient),
    actionType: 'proxy-scale-response', act, pause, play, onFinished });
}
