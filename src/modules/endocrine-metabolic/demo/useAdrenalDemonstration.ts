import { useEffect, useRef } from 'react';
import type { LearnerAction, AdrenalCrisisSnapshot } from '@platform/kernel/protocol';
import type { DemonstrationController } from '@anesthesia/demo/useDemonstration';
import { adrenalDemonstrationStep } from './adrenal-demonstration';

export function useAdrenalDemonstration({ active, running, patient, act, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly patient?: AdrenalCrisisSnapshot;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  const step = adrenalDemonstrationStep(patient);
  const sentStep = useRef<string | null>(null);
  const finished = useRef(false);
  useEffect(() => {
    if (!active) { sentStep.current = null; finished.current = false; return; }
    if (!running) return;
    if (step.finished) {
      if (!finished.current) { finished.current = true; onFinished(); }
      return;
    }
    if (step.action && sentStep.current !== step.id) {
      sentStep.current = step.id;
      act({ type: 'adrenal-crisis-response', payload: { action: step.action } });
    }
  }, [active, running, step.id, step.action, step.finished, act, onFinished]);
  return {
    beat: active ? { atSecond: 0, narration: step.narration, focus: step.focus } : null,
    progress: active ? step.progress : 0,
    finished: active && !!step.finished,
  };
}
