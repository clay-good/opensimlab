/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, ThyroidStormSnapshot } from '@platform/kernel/protocol';
import { ThyroidStorm, THYROID_IODINE_WAIT_TICKS, THYROID_RESPONSE_TICKS, THYROID_TAKEOVER_TICKS } from '../../src/modules/endocrine-metabolic/thyroid-storm';
import { useThyroidDemonstration } from '../../src/modules/endocrine-metabolic/demo/useThyroidDemonstration';

function Harness(props: {
  active: boolean; running: boolean; patient?: ThyroidStormSnapshot;
  onAction: (action: Omit<LearnerAction, 'tick'>) => void;
  pause: () => void; play: () => void; onFinish: () => void; onTake: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useThyroidDemonstration({ active: props.active, running: props.running, patient: props.patient,
    act: props.onAction, pause: props.pause, play: props.play, onFinished: props.onFinish });
  props.capture(demo.onAdvance);
  return <DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={props.onTake} />;
}

describe('Thyroid storm learner-paced worked example', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  function session() {
    let model = new ThyroidStorm(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    let active = true; let advance: (() => void) | undefined;
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    const onAction = vi.fn((action: Omit<LearnerAction, 'tick'>) => {
      expect(action.type).toBe('thyroid-storm-response'); model.apply(action.payload?.action, clock.tick);
    });
    const take = vi.fn(() => { active = false; render(); });
    const render = (patient: ThyroidStormSnapshot | undefined = model.snapshot(clock.tick)) => act(() => root.render(<StrictMode>
      <Harness active={active} running={clock.state === 'running'} patient={patient} onAction={onAction}
        pause={pause} play={play} onFinish={finish} onTake={take} capture={(callback) => { advance = callback; }} />
    </StrictMode>));
    const next = () => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Continue example')!;
    const jump = (tick: number, acceptResponse = true) => {
      const running = clock.state === 'running'; clock.restore(tick); if (running) clock.play();
      if (acceptResponse) model.advance(tick); render();
    };
    const continueOnce = () => {
      const count = onAction.mock.calls.length; const plays = play.mock.calls.length;
      expect(next().getAttribute('aria-disabled')).toBe('false'); expect(clock.state).toBe('paused');
      const callback = advance!;
      act(() => { next().click(); next().click(); callback(); expect(onAction.mock.calls.length).toBe(count + 1); });
      expect(play.mock.calls.length).toBe(plays + 1); expect(clock.state).toBe('running');
      expect(next().getAttribute('aria-disabled')).toBe('true');
      render();
    };
    return { clock, pause, play, finish, onAction, take, render, next, jump, continueOnce,
      snapshot: () => model.snapshot(clock.tick), callback: () => advance,
      setActive: (value: boolean) => { active = value; render(); },
      restart: () => { active = false; render(); model = new ThyroidStorm(); clock.reset(); clock.play(); active = true; render(); },
    };
  }

  it('does not pause or dispatch while preparing, and keeps a focusable guarded Continue', () => {
    const onAction = vi.fn(); const pause = vi.fn(); const play = vi.fn(); const finish = vi.fn();
    act(() => root.render(<StrictMode><Harness active running onAction={onAction} pause={pause} play={play}
      onFinish={finish} onTake={() => {}} capture={() => {}} /></StrictMode>));
    expect(container.textContent).toContain('Preparing the fictional patient');
    const next = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Continue example')!;
    expect(next.getAttribute('aria-disabled')).toBe('true'); expect(next.disabled).toBe(false);
    next.focus(); act(() => { next.click(); next.click(); });
    expect(document.activeElement).toBe(next); expect(onAction).not.toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled(); expect(finish).not.toHaveBeenCalled();
  });

  it('freezes the actual clock to read, dispatches synchronously once, and rejects duplicate and stale-step callbacks', () => {
    const view = session(); const patient = view.snapshot(); view.render();
    expect(view.pause).toHaveBeenCalled(); expect(view.onAction).not.toHaveBeenCalled();
    const pauses = view.pause.mock.calls.length; const narration = container.querySelector('.demo-bar__text')!.textContent;
    for (let read = 0; read < 20; read++) {
      expect(view.clock.ticksFor(60_000)).toBe(0); view.render({ ...patient });
    }
    expect(view.clock.tick).toBe(0); expect(view.pause.mock.calls.length).toBe(pauses);
    expect(container.querySelector('.demo-bar__text')!.textContent).toBe(narration);
    expect(view.play).not.toHaveBeenCalled(); expect(view.onAction).not.toHaveBeenCalled();
    const stale = view.callback()!; const next = view.next(); next.focus();
    act(() => { next.click(); next.click(); stale(); expect(view.onAction).toHaveBeenCalledOnce(); });
    expect(view.onAction).toHaveBeenCalledExactlyOnceWith({ type: 'thyroid-storm-response', payload: { action: 'synthesis-blockade' } });
    view.render({ ...patient }); view.render({ ...patient });
    expect(view.pause.mock.calls.length).toBe(pauses); expect(view.callback()).toBeUndefined();
    expect(view.next()).toBe(next); expect(next.disabled).toBe(false); expect(next.getAttribute('aria-disabled')).toBe('true');
    act(() => { next.click(); stale(); });
    expect(view.onAction).toHaveBeenCalledOnce(); expect(view.play).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(next);
    view.render(); expect(view.pause.mock.calls.length).toBeGreaterThan(pauses);
    expect(view.snapshot().synthesisAtTick).toBe(0); expect(view.snapshot().supportiveCareAtTick).toBeNull();
    act(() => stale()); expect(view.onAction).toHaveBeenCalledOnce();
    expect(view.next()).toBe(next); expect(next.getAttribute('aria-disabled')).toBe('false');
  });

  it('takes over without resetting care, invalidates retained callbacks, and starts a new explicit run cleanly', () => {
    const view = session(); view.render(); view.continueOnce();
    const pending = view.callback()!; const before = view.snapshot(); const pauses = view.pause.mock.calls.length;
    act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Take the controls')!.click());
    expect(view.take).toHaveBeenCalledOnce(); expect(view.snapshot()).toEqual(before);
    view.render(); act(() => pending());
    expect(view.onAction).toHaveBeenCalledOnce(); expect(view.play).toHaveBeenCalledOnce();
    expect(view.pause.mock.calls.length).toBe(pauses); expect(view.finish).not.toHaveBeenCalled();
    expect(container.querySelector('.demo-bar')).toBeNull(); expect(view.callback()).toBeUndefined();
    view.setActive(true); expect(view.snapshot()).toEqual(before); view.continueOnce();
    expect(view.onAction.mock.calls[1]![0].payload).toEqual({ action: 'supportive-care' });
    view.restart(); expect(view.snapshot().synthesisAtTick).toBeNull(); expect(view.clock.tick).toBe(0);
    view.continueOnce(); expect(view.onAction.mock.calls[2]![0].payload).toEqual({ action: 'synthesis-blockade' });
    expect(view.finish).not.toHaveBeenCalled();
  });

  it('rejects a retained callback from a prior run even when restarting at the same initial step', () => {
    const view = session(); view.render(); const priorRun = view.callback()!;
    view.setActive(false); view.restart();
    const currentRun = view.callback()!;
    act(() => priorRun());
    expect(view.onAction).not.toHaveBeenCalled(); expect(view.play).not.toHaveBeenCalled();
    expect(view.snapshot().synthesisAtTick).toBeNull(); expect(view.clock.state).toBe('paused');
    act(() => currentRun());
    expect(view.onAction).toHaveBeenCalledExactlyOnceWith({ type: 'thyroid-storm-response', payload: { action: 'synthesis-blockade' } });
    expect(view.play).toHaveBeenCalledOnce();
  });

  it('rejects a retained callback after the actual cockpit root unmounts without an inactive render', () => {
    const view = session(); view.render(); const disposed = view.callback()!;
    const snapshot = view.snapshot(); const pauses = view.pause.mock.calls.length;
    act(() => root.unmount());
    try {
      act(() => disposed());
      expect(view.onAction).not.toHaveBeenCalled(); expect(view.play).not.toHaveBeenCalled();
      expect(view.finish).not.toHaveBeenCalled(); expect(view.pause.mock.calls.length).toBe(pauses);
      expect(view.snapshot()).toEqual(snapshot); expect(view.clock.state).toBe('paused');
    } finally {
      // The suite cleanup owns this replacement; the disposed hook stays unmounted.
      root = createRoot(container);
    }
  });

  it('invalidates old callbacks after a distinct accepted step even if a later snapshot returns to the same step id', () => {
    const view = session(); const initial = view.snapshot(); view.render(); const oldInitial = view.callback()!;
    view.continueOnce(); view.continueOnce();
    expect(view.onAction).toHaveBeenCalledTimes(2);
    view.render(initial); const currentInitial = view.callback()!;
    const plays = view.play.mock.calls.length;
    act(() => oldInitial());
    expect(view.onAction).toHaveBeenCalledTimes(2); expect(view.play.mock.calls.length).toBe(plays);
    act(() => currentInitial());
    expect(view.onAction).toHaveBeenCalledTimes(3); expect(view.play.mock.calls.length).toBe(plays + 1);
  });

  it('walks nine decisions through exact readiness boundaries, honors external pauses, and finishes once', () => {
    const view = session(); view.render();
    for (let decision = 0; decision < 6; decision++) view.continueOnce();
    expect(view.onAction.mock.calls.map(([action]) => action.payload?.action)).toEqual([
      'synthesis-blockade', 'supportive-care', 'call-support', 'assess-circulation', 'rate-control-review', 'reassess',
    ]);
    expect(view.snapshot().observation?.atTick).toBe(0); expect(view.snapshot().responseObserved).toBe(false);
    const waitWithoutActing = () => {
      const actions = view.onAction.mock.calls.length; const pauses = view.pause.mock.calls.length; const plays = view.play.mock.calls.length;
      expect(view.next().getAttribute('aria-disabled')).toBe('true'); expect(view.next().disabled).toBe(false);
      for (let read = 0; read < 5; read++) { view.render(); act(() => view.next().click()); }
      expect(view.onAction.mock.calls.length).toBe(actions); expect(view.pause.mock.calls.length).toBe(pauses);
      expect(view.play.mock.calls.length).toBe(plays);
    };
    waitWithoutActing(); expect(view.clock.state).toBe('running');
    // Source/report overlays pause externally. Closing one does not silently resume or act.
    view.clock.pause(); view.render(); const frozen = view.snapshot();
    expect(view.clock.ticksFor(60_000)).toBe(0); waitWithoutActing(); expect(view.snapshot()).toEqual(frozen);
    expect(view.clock.state).toBe('paused'); view.render(); expect(view.clock.state).toBe('paused');
    view.clock.play(); view.jump(THYROID_IODINE_WAIT_TICKS - 1);
    expect(view.snapshot().iodineDueInSeconds).toBe(1); waitWithoutActing();
    view.jump(THYROID_IODINE_WAIT_TICKS);
    expect(view.snapshot().iodineDueInSeconds).toBe(0); expect(view.onAction).toHaveBeenCalledTimes(6);
    expect(view.clock.ticksFor(60_000)).toBe(0); view.continueOnce();
    expect(view.snapshot().iodineAtTick).toBe(THYROID_IODINE_WAIT_TICKS);
    expect(view.snapshot().responseDueInSeconds).toBe(7_200); waitWithoutActing();
    view.clock.pause(); view.render(); waitWithoutActing(); expect(view.clock.ticksFor(60_000)).toBe(0);
    view.clock.play(); view.jump(THYROID_IODINE_WAIT_TICKS + THYROID_RESPONSE_TICKS - 1);
    expect(view.snapshot().responseDueInSeconds).toBe(1); waitWithoutActing();
    view.jump(THYROID_IODINE_WAIT_TICKS + THYROID_RESPONSE_TICKS, false);
    expect(view.snapshot().responseDueInSeconds).toBe(0); waitWithoutActing();
    view.jump(THYROID_IODINE_WAIT_TICKS + THYROID_RESPONSE_TICKS);
    expect(view.snapshot().responseDueInSeconds).toBeNull(); expect(view.snapshot().responseObserved).toBe(false);
    expect(view.onAction).toHaveBeenCalledTimes(7); expect(view.clock.ticksFor(60_000)).toBe(0);
    view.continueOnce(); expect(view.snapshot().responseObserved).toBe(true);
    expect(view.snapshot().observation?.coreTemperatureC).toBe(39.3);
    const handoff = view.callback()!; view.continueOnce(); view.render(); view.render(); act(() => handoff());
    expect(view.onAction.mock.calls.map(([action]) => action)).toEqual([
      'synthesis-blockade', 'supportive-care', 'call-support', 'assess-circulation', 'rate-control-review',
      'reassess', 'iodine', 'reassess', 'handoff',
    ].map((action) => ({ type: 'thyroid-storm-response', payload: { action } })));
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', durableRecoveryProven: false, earlyIodineAttempted: false,
      urgentCoverageDelayed: false, blanketBetaBlockadeChosen: false, waitForLabsChosen: false });
    expect(view.play).toHaveBeenCalledTimes(9); expect(view.finish).toHaveBeenCalledOnce(); expect(view.clock.state).toBe('paused');
    expect(view.take).not.toHaveBeenCalled(); expect(view.next().getAttribute('aria-disabled')).toBe('true');
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('finishes an instructor-ended snapshot once even when already externally paused', () => {
    const view = session(); view.clock.pause(); view.jump(THYROID_TAKEOVER_TICKS);
    expect(view.snapshot().ended).toBe('instructor-takeover'); view.render(); view.render();
    expect(view.pause).toHaveBeenCalledOnce(); expect(view.finish).toHaveBeenCalledOnce();
    expect(view.onAction).not.toHaveBeenCalled(); expect(view.play).not.toHaveBeenCalled();
    expect(view.next().getAttribute('aria-disabled')).toBe('true');
    act(() => view.next().click()); expect(view.onAction).not.toHaveBeenCalled();
  });
});
