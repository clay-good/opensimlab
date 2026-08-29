/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import type { LearnerAction, SevereHypoglycemiaSnapshot } from '@platform/kernel/protocol';
import { SEVERE_HYPOGLYCEMIA_RECURRENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/severe-hypoglycemia-recurrence';
import { SevereHypoglycemiaTray } from '../../src/modules/endocrine-metabolic/SevereHypoglycemiaTray';
import { useHypoglycemiaDemonstration } from '../../src/modules/endocrine-metabolic/demo/useHypoglycemiaDemonstration';
import { LIMITATIONS } from '@platform/docs/limitations';

function Harness(props: { active: boolean; running: boolean; patient?: SevereHypoglycemiaSnapshot;
  onAction: (action: Omit<LearnerAction, 'tick'>) => void; onFinish: () => void; onTake: () => void;
  pause: () => void; play: () => void; captureAdvance?: (advance: (() => void) | undefined) => void }) {
  const demo = useHypoglycemiaDemonstration({ active: props.active, running: props.running,
    patient: props.patient, act: props.onAction, onFinished: props.onFinish, pause: props.pause, play: props.play });
  props.captureAdvance?.(demo.onAdvance);
  return <><DemonstrationBar beat={demo.beat} progress={demo.progress} onTakeControls={props.onTake}
    onAdvance={demo.onAdvance} awaitingAdvance={demo.awaitingAdvance} />
    <SevereHypoglycemiaTray assessment={props.patient} demonstrating={props.active} onAction={() => {}} /></>;
}

describe('Live worked-example controls', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it('offers a correctly labeled optional example from the briefing', () => {
    const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} limitations={LIMITATIONS} region={UNITED_STATES} environment="endocrine-metabolic"
      guidance="coached" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Watch a worked example')!;
    expect(SCENARIO.metadata.version).toBe('0.1.3');
    expect(button).toBeDefined(); expect(button.disabled).toBe(false);
    act(() => button.click()); expect(watch).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('60× speed'); expect(container.textContent).not.toContain('90-second');
  });
  it('does not pause and keeps Continue disabled while the patient snapshot is preparing', () => {
    const pause = vi.fn(); const play = vi.fn(); const onAction = vi.fn(); const onFinish = vi.fn();
    act(() => root.render(<StrictMode><Harness active running pause={pause} play={play}
      onAction={onAction} onFinish={onFinish} onTake={() => {}} /></StrictMode>));
    expect(container.textContent).toContain('Preparing the fictional patient');
    const next = [...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Continue example')!;
    expect(next.getAttribute('aria-disabled')).toBe('true'); expect(next.disabled).toBe(false);
    act(() => { next.click(); next.click(); });
    expect(pause).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled(); expect(onFinish).not.toHaveBeenCalled();
  });
  it('keeps checkpoints readable, dispatches Continue once, and invalidates stale callbacks on takeover', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4901, practiceRegion: 'US' });
    const onAction = vi.fn((action: Omit<LearnerAction, 'tick'>) => engine.apply({ ...action, tick: 0 }));
    const onFinish = vi.fn(); const onTake = vi.fn(); const pause = vi.fn(); const play = vi.fn();
    let advance: (() => void) | undefined;
    const patient = engine.equipment().resuscitation.severeHypoglycemia!;
    const render = (active: boolean, running: boolean, snapshot = patient) => act(() => root.render(<StrictMode><Harness
      active={active} running={running} patient={snapshot} onAction={onAction} onFinish={onFinish} onTake={onTake}
      pause={pause} play={play} captureAdvance={(callback) => { advance = callback; }} /></StrictMode>));
    render(true, true); expect(pause).toHaveBeenCalled(); expect(onAction).not.toHaveBeenCalled();
    const initialPauses = pause.mock.calls.length;
    const narration = container.querySelector('.demo-bar__text')!.textContent;
    for (let read = 0; read < 20; read += 1) render(true, false, { ...patient });
    expect(container.querySelector('.demo-bar__text')!.textContent).toBe(narration);
    expect(pause.mock.calls.length).toBe(initialPauses); expect(onAction).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
    const scenarioButtons = [...container.querySelectorAll('button')].filter((entry) => !entry.closest('.demo-bar'));
    expect(scenarioButtons.length).toBeGreaterThan(0);
    expect(scenarioButtons.every((entry) => entry.disabled)).toBe(true);
    const staleAdvance = advance!;
    const next = [...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Continue example')!;
    expect(next.getAttribute('aria-disabled')).toBe('false'); expect(next.disabled).toBe(false); next.focus();
    act(() => {
      next.click(); next.click(); staleAdvance();
      expect(onAction).toHaveBeenCalledOnce(); expect(play).toHaveBeenCalledOnce();
    });
    expect(document.activeElement).toBe(next);
    expect(next.getAttribute('aria-disabled')).toBe('true'); expect(next.disabled).toBe(false);
    expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: 'severe-hypoglycemia-response', payload: { action: 'check-glucose' } });
    render(true, true, { ...patient }); render(true, false, { ...patient });
    expect([...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Continue example')).toBe(next);
    expect(next.getAttribute('aria-disabled')).toBe('true'); expect(next.disabled).toBe(false);
    expect(advance).toBeUndefined();
    act(() => { next.click(); next.click(); });
    expect(onAction).toHaveBeenCalledOnce(); expect(play).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(next);
    expect(pause.mock.calls.length).toBe(initialPauses); expect(onAction).toHaveBeenCalledOnce();
    const acceptedState = engine.equipment().resuscitation.severeHypoglycemia!;
    expect(acceptedState.glucoseMgPerDl).toBe(36); expect(acceptedState.supportActive).toBe(false);
    render(true, true, acceptedState); expect(pause.mock.calls.length).toBeGreaterThan(initialPauses);
    const nextPauses = pause.mock.calls.length;
    expect([...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Continue example')).toBe(next);
    expect(next.getAttribute('aria-disabled')).toBe('false'); expect(next.disabled).toBe(false);
    act(() => staleAdvance()); expect(onAction).toHaveBeenCalledOnce(); expect(play).toHaveBeenCalledOnce();
    const takeoverAdvance = advance!;
    for (let read = 0; read < 20; read += 1) render(true, false, acceptedState);
    expect(onAction).toHaveBeenCalledOnce();
    act(() => [...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Take the controls')!.click());
    expect(onTake).toHaveBeenCalledOnce();
    render(false, true, acceptedState); render(false, true, acceptedState);
    act(() => { takeoverAdvance(); staleAdvance(); });
    expect(onAction).toHaveBeenCalledOnce(); expect(onFinish).not.toHaveBeenCalled();
    expect(pause.mock.calls.length).toBe(nextPauses); expect(play).toHaveBeenCalledOnce();
    expect(advance).toBeUndefined(); expect(container.textContent).not.toContain('Continue example');
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(engine.equipment().resuscitation.severeHypoglycemia).toEqual(acceptedState);
    expect([...container.querySelectorAll('button')].some((entry) => !entry.disabled)).toBe(true);
    render(true, true, acceptedState);
    expect(pause.mock.calls.length).toBeGreaterThan(nextPauses); expect(onAction).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('Continue example');
  });
  it('drives the real engine through both rescues, waits without duplicate actions, and finishes once', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4901, practiceRegion: 'US' });
    const onFinish = vi.fn(); const onTake = vi.fn(); let tick = 0; let waitingRenders = 0; let running = true;
    const pause = vi.fn(() => { running = false; }); const play = vi.fn(() => { running = true; });
    const onAction = vi.fn((action: Omit<LearnerAction, 'tick'>) => engine.apply({ ...action, tick }));
    const render = () => act(() => root.render(<StrictMode><Harness active running={running}
      patient={engine.equipment().resuscitation.severeHypoglycemia} onAction={onAction} onFinish={onFinish} onTake={onTake}
      pause={pause} play={play} /></StrictMode>));
    for (; tick < 36000 && !engine.equipment().resuscitation.severeHypoglycemia?.ended;) {
      const count = onAction.mock.calls.length; const pauses = pause.mock.calls.length; const plays = play.mock.calls.length;
      render();
      expect(onAction.mock.calls.length).toBe(count);
      const next = [...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Continue example');
      expect(next).toBeDefined();
      if (next && next.getAttribute('aria-disabled') === 'false') {
        expect(running).toBe(false); expect(pause.mock.calls.length).toBeGreaterThan(pauses);
        const narration = container.querySelector('.demo-bar__text')!.textContent;
        for (let read = 0; read < 5; read += 1) render();
        expect(container.querySelector('.demo-bar__text')!.textContent).toBe(narration);
        expect(onAction.mock.calls.length).toBe(count);
        act(() => { next.click(); next.click(); expect(onAction.mock.calls.length).toBe(count + 1); });
        expect(running).toBe(true);
      } else {
        expect(next?.getAttribute('aria-disabled')).toBe('true'); expect(next?.disabled).toBe(false);
        act(() => { next!.click(); next!.click(); });
        expect(onAction.mock.calls.length).toBe(count); expect(play.mock.calls.length).toBe(plays);
        render(); render(); expect(onAction.mock.calls.length).toBe(count);
        expect(pause.mock.calls.length).toBe(pauses); expect(running).toBe(true); waitingRenders += 1;
      }
      for (let step = 0; step < 120; step += 1) { engine.step(); tick += 1; }
    }
    expect(onFinish).not.toHaveBeenCalled();
    running = false; const pauses = pause.mock.calls.length;
    render(); render(); render();
    expect(pause.mock.calls.length).toBe(pauses + 1); expect(play).toHaveBeenCalledTimes(10);
    expect(waitingRenders).toBeGreaterThan(0);
    expect(onAction.mock.calls.map(([action]) => action)).toEqual([
      'check-glucose', 'call-support', 'iv-rescue', 'check-glucose', 'review-medications',
      'continue-monitoring', 'check-glucose', 'iv-rescue', 'check-glucose', 'handoff',
    ].map((action) => ({ type: 'severe-hypoglycemia-response', payload: { action } })));
    expect(engine.equipment().resuscitation.severeHypoglycemia?.ended).toBe('handoff');
    expect(onAction).toHaveBeenCalledTimes(10); expect(onFinish).toHaveBeenCalledOnce();
    expect(onTake).not.toHaveBeenCalled();
    expect([...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Continue example')?.getAttribute('aria-disabled')).toBe('true');
    expect(container.textContent).toContain('not the real-world recurrence risk');
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  }, 120_000);
});
