/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import type { AdrenalCrisisSnapshot, LearnerAction } from '@platform/kernel/protocol';
import { ADRENAL_CRISIS_TREATMENT_BEFORE_TESTS as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/adrenal-crisis-treatment-before-tests';
import { AdrenalCrisisTray } from '../../src/modules/endocrine-metabolic/AdrenalCrisisTray';
import { useAdrenalDemonstration } from '../../src/modules/endocrine-metabolic/demo/useAdrenalDemonstration';

function Harness(props: { active: boolean; running: boolean; patient?: AdrenalCrisisSnapshot;
  onAction: (action: Omit<LearnerAction, 'tick'>) => void; onFinish: () => void; onTake: () => void }) {
  const demo = useAdrenalDemonstration({ active: props.active, running: props.running,
    patient: props.patient, act: props.onAction, onFinished: props.onFinish });
  return <><DemonstrationBar beat={demo.beat} progress={demo.progress} onTakeControls={props.onTake} />
    <AdrenalCrisisTray assessment={props.patient} scenarioVersion={SCENARIO.metadata.version} demonstrating={props.active} onAction={() => {}} /></>;
}

describe('Adrenal crisis worked-example controls', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it.each(['guided', 'unassisted'] as const)('keeps a pausing source link available while watching in %s mode', (guidance) => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4902, practiceRegion: 'US' });
    const pause = vi.fn();
    act(() => root.render(<AdrenalCrisisTray assessment={engine.equipment().resuscitation.adrenalCrisis}
      scenarioVersion={SCENARIO.metadata.version} demonstrating guidance={guidance} onAction={() => {}} onOpenSource={pause} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    const source = container.querySelector('a')!;
    expect(source.href).toBe('https://www.endocrine.org/clinical-practice-guidelines/primary-adrenal-insufficiency');
    expect(source.target).toBe('_blank'); expect(source.rel).toBe('noreferrer');
    act(() => source.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
    expect(pause).toHaveBeenCalledOnce();
  });
  it.each(['0.1.0', '0.1.1', '0.1.2'])('uses the actual %s version for inline guidance after takeover', (scenarioVersion) => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4902, practiceRegion: 'US' });
    act(() => root.render(<AdrenalCrisisTray assessment={engine.equipment().resuscitation.adrenalCrisis}
      scenarioVersion={scenarioVersion} guidance="guided" onAction={() => {}} />));
    expect(container.querySelector('[aria-label="Private tutor"]') !== null).toBe(scenarioVersion === '0.1.1');
    expect(container.querySelector('a')).not.toBeNull();
  });
  it('offers the exact optional worked example at 60× speed from the briefing', () => {
    const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} region={UNITED_STATES} environment="endocrine-metabolic"
      guidance="coached" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    const button = [...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Watch a worked example')!;
    expect(SCENARIO.metadata.version).toBe('0.1.1');
    expect(button).toBeDefined(); expect(button.disabled).toBe(false);
    act(() => button.click()); expect(watch).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('60× speed'); expect(container.textContent).not.toContain('90-second');
  });
  it('dispatches once with a stale snapshot in Strict Mode, pauses, and preserves rescue on takeover', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4902, practiceRegion: 'US' });
    const onAction = vi.fn((action: Omit<LearnerAction, 'tick'>) => engine.apply({ ...action, tick: 0 }));
    const onFinish = vi.fn(); const onTake = vi.fn();
    const patient = engine.equipment().resuscitation.adrenalCrisis!;
    const render = (active: boolean, running: boolean, snapshot = patient) => act(() => root.render(<StrictMode><Harness
      active={active} running={running} patient={snapshot} onAction={onAction} onFinish={onFinish} onTake={onTake} /></StrictMode>));
    render(true, false); expect(onAction).not.toHaveBeenCalled();
    render(true, true); render(true, true); render(true, true, { ...patient });
    expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: 'adrenal-crisis-response', payload: { action: 'hydrocortisone' } });
    const acceptedState = engine.equipment().resuscitation.adrenalCrisis!;
    expect(acceptedState.hydrocortisoneAtTick).toBe(0);
    expect(acceptedState.salineAtTick).toBeNull(); expect(acceptedState.recordReviewed).toBe(false);
    const scenarioButtons = [...container.querySelectorAll('button')].filter((entry) => entry.textContent !== 'Take the controls');
    expect(scenarioButtons.length).toBeGreaterThan(0);
    expect(scenarioButtons.every((entry) => entry.disabled)).toBe(true);
    render(true, false, acceptedState); render(true, false, acceptedState);
    expect(onAction).toHaveBeenCalledOnce();
    act(() => [...container.querySelectorAll('button')].find((entry) => entry.textContent === 'Take the controls')!.click());
    expect(onTake).toHaveBeenCalledOnce();
    render(false, true, acceptedState); render(false, true, acceptedState);
    expect(onAction).toHaveBeenCalledOnce(); expect(onFinish).not.toHaveBeenCalled();
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(engine.equipment().resuscitation.adrenalCrisis).toEqual(acceptedState);
    expect([...container.querySelectorAll('button')].some((entry) => !entry.disabled)).toBe(true);
  });
  it('drives seven ordered real-engine decisions, waits for the response, and finishes the handoff once', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4902, practiceRegion: 'US' });
    const onFinish = vi.fn(); const onTake = vi.fn(); let tick = 0; let waitingRenders = 0;
    const onAction = vi.fn((action: Omit<LearnerAction, 'tick'>) => engine.apply({ ...action, tick }));
    const render = (running = true) => act(() => root.render(<StrictMode><Harness active running={running}
      patient={engine.equipment().resuscitation.adrenalCrisis} onAction={onAction} onFinish={onFinish} onTake={onTake} /></StrictMode>));
    for (; tick < 18000 && !engine.equipment().resuscitation.adrenalCrisis?.ended;) {
      render();
      const count = onAction.mock.calls.length;
      render(false); render(false); expect(onAction.mock.calls.length).toBe(count);
      const patient = engine.equipment().resuscitation.adrenalCrisis!;
      if (patient.recordReviewed && patient.responseDueInSeconds !== null) {
        render(); render(); expect(onAction.mock.calls.length).toBe(count); waitingRenders += 1;
      }
      for (let step = 0; step < 120; step += 1) { engine.step(); tick += 1; }
    }
    render(false); expect(onFinish).not.toHaveBeenCalled();
    render(); render();
    expect(waitingRenders).toBeGreaterThan(0);
    expect(onAction.mock.calls.map(([action]) => action)).toEqual([
      'hydrocortisone', 'saline', 'call-support', 'review-record', 'reassess', 'prevention', 'handoff',
    ].map((action) => ({ type: 'adrenal-crisis-response', payload: { action } })));
    expect(engine.equipment().resuscitation.adrenalCrisis).toMatchObject({
      supportActive: true, recordReviewed: true, responseObserved: true, preventionPlanned: true,
      ended: 'handoff', durableRecoveryProven: false,
    });
    expect(onFinish).toHaveBeenCalledOnce(); expect(onTake).not.toHaveBeenCalled();
    expect(container.textContent).toContain('not discharge clearance');
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  }, 30_000);
});
