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

function Harness(props: { active: boolean; running: boolean; patient?: SevereHypoglycemiaSnapshot;
  onAction: (action: Omit<LearnerAction, 'tick'>) => void; onFinish: () => void; onTake: () => void }) {
  const demo = useHypoglycemiaDemonstration({ active: props.active, running: props.running,
    patient: props.patient, act: props.onAction, onFinished: props.onFinish });
  return <><DemonstrationBar beat={demo.beat} progress={demo.progress} onTakeControls={props.onTake} />
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
    act(() => root.render(<Prebrief scenario={SCENARIO} region={UNITED_STATES} environment="endocrine-metabolic"
      guidance="coached" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Watch a worked example')!;
    act(() => button.click()); expect(watch).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('60× speed'); expect(container.textContent).not.toContain('90-second');
  });
  it('sends a stage once under repeated renders, pauses, and stops immediately on takeover', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4901, practiceRegion: 'US' });
    const onAction = vi.fn((action: Omit<LearnerAction, 'tick'>) => engine.apply({ ...action, tick: 0 }));
    const onFinish = vi.fn(); const onTake = vi.fn();
    const patient = engine.equipment().resuscitation.severeHypoglycemia;
    const render = (active: boolean, running: boolean) => act(() => root.render(<StrictMode><Harness
      active={active} running={running} patient={patient} onAction={onAction} onFinish={onFinish} onTake={onTake} /></StrictMode>));
    render(true, false); expect(onAction).not.toHaveBeenCalled();
    render(true, true); render(true, true); expect(onAction).toHaveBeenCalledOnce();
    const acceptedState = engine.equipment().resuscitation.severeHypoglycemia;
    expect(acceptedState?.glucoseMgPerDl).toBe(36);
    const scenarioButtons = [...container.querySelectorAll('button')].filter((entry) => entry.textContent !== 'Take the controls');
    expect(scenarioButtons.every((entry) => entry.disabled)).toBe(true);
    render(true, false); expect(onAction).toHaveBeenCalledOnce();
    act(() => [...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Take the controls')!.click());
    expect(onTake).toHaveBeenCalledOnce();
    render(false, true); render(false, true); expect(onAction).toHaveBeenCalledOnce();
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(engine.equipment().resuscitation.severeHypoglycemia).toEqual(acceptedState);
    expect([...container.querySelectorAll('button')].some((entry) => !entry.disabled)).toBe(true);
  });
  it('drives the real engine through both rescues, waits without duplicate actions, and finishes once', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4901, practiceRegion: 'US' });
    const onFinish = vi.fn(); const onTake = vi.fn(); let tick = 0;
    const onAction = vi.fn((action: Omit<LearnerAction, 'tick'>) => engine.apply({ ...action, tick }));
    const render = (running = true) => act(() => root.render(<Harness active running={running}
      patient={engine.equipment().resuscitation.severeHypoglycemia} onAction={onAction} onFinish={onFinish} onTake={onTake} />));
    for (; tick < 36000 && !engine.equipment().resuscitation.severeHypoglycemia?.ended;) {
      render();
      const count = onAction.mock.calls.length;
      render(false); render(false); expect(onAction.mock.calls.length).toBe(count);
      for (let step = 0; step < 120; step += 1) { engine.step(); tick += 1; }
    }
    render(); render();
    expect(engine.equipment().resuscitation.severeHypoglycemia?.ended).toBe('handoff');
    expect(onAction).toHaveBeenCalledTimes(10); expect(onFinish).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('not the real-world recurrence risk');
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  }, 30_000);
});
