import { useEffect, useRef, useState } from 'react';
import type { LearnerAction } from '@platform/kernel/protocol';
import type { DemonstrationBeat } from './demonstration';
import type { DemonstrationController } from './useDemonstration';

interface ObservedStep {
  readonly id: string;
  readonly narration: string;
  readonly focus: DemonstrationBeat['focus'];
  readonly progress: number;
  readonly action?: string;
  readonly finished?: boolean;
}

/** Read at a stopped clock; continue one decision through the ordinary action path. */
export function useObservedDemonstration({ active, running, step, actionType, act, pause, play, onFinished }: {
  readonly active: boolean;
  readonly running: boolean;
  readonly step: ObservedStep;
  readonly actionType: string;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  readonly pause: () => void;
  readonly play: () => void;
  readonly onFinished: () => void;
}): DemonstrationController {
  const [submittedStep, setSubmittedStep] = useState<string | null>(null);
  const submitted = useRef<string | null>(null);
  const finished = useRef(false);
  const mounted = useRef(false);
  const latest = useRef({ active, step, generation: 0 });
  // Returning to the same id after takeover or another step must not revive
  // an earlier Continue callback. Same-step snapshot updates keep their token.
  const generation = latest.current.generation
    + Number(latest.current.active !== active || latest.current.step.id !== step.id);
  latest.current = { active, step, generation };
  const pending = active && !!step.action && submittedStep !== step.id;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!active) {
      submitted.current = null; setSubmittedStep(null); finished.current = false;
      return;
    }
    if (step.finished) {
      if (!finished.current) { finished.current = true; pause(); onFinished(); }
      return;
    }
    // Preparing needs an advance to receive its first snapshot. A submitted
    // action also needs an advance before its acceptance becomes visible.
    if (pending && running && submitted.current !== step.id) pause();
  }, [active, pending, running, step.id, step.finished, pause, onFinished]);

  const onAdvance = pending ? () => {
    // A double click or a retained callback after takeover cannot act again.
    if (!mounted.current || !latest.current.active || latest.current.generation !== generation || latest.current.step.id !== step.id
      || submitted.current === step.id || !step.action) return;
    submitted.current = step.id; setSubmittedStep(step.id);
    act({ type: actionType, payload: { action: step.action } });
    play();
  } : undefined;
  return {
    beat: active ? { atSecond: 0, narration: step.narration, focus: step.focus } : null,
    progress: active ? step.progress : 0,
    finished: active && !!step.finished,
    onAdvance,
    awaitingAdvance: active ? pending : undefined,
  };
}
