/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cockpit } from '@anesthesia/ui/Cockpit';
import type { StateField } from '@anesthesia/physiology';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SonificationEngine } from '@platform/audio/sonification';
import { useSession } from '@platform/session/session-store';
import { HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypocalcemic-tetany-rescue-and-recurrence';
import { Hypocalcemia, HYPOCALCEMIA_RESPONSE_TICKS } from '../../src/modules/endocrine-metabolic/hypocalcemia';

// Real Cockpit keyboard handlers, store subscription, live regions, and Why drawer.
// Only the canvas regions are replaced; these buttons exercise the actual Why wiring.
vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));

const initialSession = useSession.getState();

describe('Hypocalcemia nonvisual care and observation boundaries', () => {
  let container: HTMLDivElement; let root: Root;
  const perform = vi.fn(); const play = vi.fn(); const pause = vi.fn();
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1)); vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); useSession.setState(initialSession, true);
    vi.unstubAllGlobals(); vi.clearAllMocks();
  });

  function mount(engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 5005, practiceRegion: 'US' })) {
    const frame = engine.step();
    useSession.setState({ ...initialSession, phase: 'running', transport: 'paused', guidance: 'unassisted',
      state: frame.state, equipment: frame.equipment, tick: frame.tick, play, pause, act: perform, alarms: [],
    });
    act(() => root.render(<Cockpit scenario={SCENARIO} region={UNITED_STATES}
      moduleId="endocrine-metabolic" audio={new SonificationEngine()} onEnd={() => {}} />));
    return frame;
  }
  function read(key: 's' | 'w') {
    act(() => container.querySelector('#monitor-region')!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
    return container.querySelector('.visually-hidden[aria-live="polite"][aria-atomic="true"]')!.textContent!;
  }
  function expectNoGenericEquipment(summary: string) {
    expect(summary).not.toMatch(/Ventilator:|inspired oxygen fraction|fresh gas flow|tidal volume|minute ventilation|not delivering|infusions|held airway|sampling line connected|independent ventilation cross-check|predicted depth/i);
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled(); expect(pause).not.toHaveBeenCalled();
  }
  // This is a standalone model → real store/Cockpit presentation check, not a
  // 1-hour solver replay. The surrounding equipment and vitals use a real initial frame.
  function publishObservation(model: Hypocalcemia, tick: number) {
    const equipment = useSession.getState().equipment!;
    act(() => useSession.setState({ tick, equipment: { ...equipment,
      resuscitation: { ...equipment.resuscitation, hypocalcemia: model.snapshot(tick) },
    } }));
  }

  it('speaks not-yet-started rescue without inventing a requested calcium result', () => {
    mount(); const summary = read('s');
    expect(summary).toContain('Authored qualified calcium rescue: not yet started');
    expect(summary).toContain('No calcium and bedside reassessment has been requested');
    expect(summary).not.toContain('6.6 milligrams per deciliter');
    expect(summary).toContain('Heart rate: 98'); expectNoGenericEquipment(summary);
  });

  it('speaks accepted qualified rescue without generic pump or ventilator claims', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 5005, practiceRegion: 'US' });
    engine.apply({ tick: 0, type: 'hypocalcemia-response', payload: { action: 'calcium-rescue' } });
    const frame = mount(engine); expect(frame.equipment.resuscitation.hypocalcemia?.calciumAtTick).toBe(0);
    const summary = read('s'); expect(summary).toContain('Authored qualified calcium rescue: started');
    expect(summary).toContain('Oxygen settings and exhaled carbon dioxide are not supplied');
    expectNoGenericEquipment(summary);
  });

  it('keeps calcium historical through the model checkpoint and updates only on explicit reassessment', () => {
    mount(); const model = new Hypocalcemia(); model.apply('reassess', 0);
    for (const action of ['calcium-rescue', 'assess-risk', 'review-cause', 'magnesium', 'continuing-care', 'call-support'] as const) model.apply(action, 0);
    model.advance(HYPOCALCEMIA_RESPONSE_TICKS);
    expect(model.vitals().adjustedCalciumMgDl).toBe(7.2);
    publishObservation(model, HYPOCALCEMIA_RESPONSE_TICKS);
    const historical = read('s');
    expect(historical).toContain('Last requested adjusted calcium at simulated 00:00:00: 6.6 milligrams per deciliter');
    expect(historical).toContain('historical observation, not a live measurement');
    expect(historical).not.toContain('7.2'); expectNoGenericEquipment(historical);
    model.apply('reassess', HYPOCALCEMIA_RESPONSE_TICKS);
    publishObservation(model, HYPOCALCEMIA_RESPONSE_TICKS);
    const fresh = read('s');
    expect(fresh).toContain('Last requested adjusted calcium at simulated 01:00:00: 7.2 milligrams per deciliter');
    expect(fresh).toContain('The supplied QTc is not calculated by the waveform');
    expect(fresh).toContain('Symptom relief does not establish sustained calcium control or recovery');
    expectNoGenericEquipment(fresh);
  });

  it('describes unavailable capnography without inventing a blood-gas decision in this lesson', () => {
    mount(); const summary = read('w');
    expect(summary).toContain('Capnography: Not supplied in this lesson');
    expect(summary).not.toMatch(/blood-gas|arterial carbon dioxide|rectangular|alveolar plateau|alpha angle|No waveform: no gas is moving/);
    expect(summary).toContain('Electrocardiogram'); expect(summary).toContain('Plethysmogram');
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });

  it('keeps unsupported EtCO₂ threshold crossings silent and announces supplied saturation changes', () => {
    mount();
    const spoken = () => [...container.querySelectorAll('.visually-hidden[aria-live], .visually-hidden[role="alert"]')]
      .map((region) => region.textContent).join(' ');
    act(() => useSession.setState({ state: { ...useSession.getState().state!, etco2MmHg: 80 } }));
    expect(spoken()).not.toMatch(/end-tidal|carbon dioxide/i);
    act(() => useSession.setState({ state: { ...useSession.getState().state!, spo2Percent: 85 } }));
    expect(spoken()).toContain('Oxygen saturation fell below 90'); expect(spoken()).toContain('now 85');
    expect(spoken()).not.toMatch(/end-tidal|carbon dioxide/i);
  });

  it.each(['etco2MmHg', 'fio2'] as const)('keeps hidden %s values unavailable in the real Why drawer', (field) => {
    mount(); act(() => container.querySelector<HTMLButtonElement>(`[data-why-field="${field}"]`)!.click());
    const drawer = container.querySelector('[role="dialog"]')!;
    expect(drawer.querySelector('.numeric')!.textContent).toMatch(/^--\s/);
    expect(drawer.textContent).toContain('These are authored teaching states, not predicted physiology or treatment kinetics');
    expect(drawer.textContent).toContain('Calcium is shown only as an explicitly requested historical observation');
    expect(drawer.textContent).not.toMatch(/own baseline|Ranked contributors/);
  });

  it('preserves the supplied heart rate in Why without generic physiology attribution', () => {
    mount(); act(() => container.querySelector<HTMLButtonElement>('[data-why-field="heartRateBpm"]')!.click());
    const drawer = container.querySelector('[role="dialog"]')!;
    expect(drawer.querySelector('.numeric')!.textContent).toMatch(/^98\s/);
    expect(drawer.textContent).toContain('These are authored teaching states');
    expect(drawer.textContent).not.toMatch(/own baseline|Ranked contributors/);
  });
  it('wires the dedicated rescue action and keeps the source link pausing and read-only', () => {
    mount();
    const rescue = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Start qualified calcium rescue')!;
    act(() => rescue.click());
    expect(perform).toHaveBeenCalledExactlyOnceWith({ type: 'hypocalcemia-response', payload: { action: 'calcium-rescue' } });
    const source = [...container.querySelectorAll('a')].find((link) => link.href === 'https://doi.org/10.1530/EC-16-0056')!;
    source.addEventListener('click', (event) => event.preventDefault()); act(() => source.click());
    expect(pause).toHaveBeenCalledOnce(); expect(play).not.toHaveBeenCalled(); expect(perform).toHaveBeenCalledOnce();
  });

  it.each(['paused', 'running'] as const)('returns takeover focus to the stable %s transport control without changing care or clock', (transport) => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 5006, practiceRegion: 'US' });
    mount(engine);
    const take = vi.fn();
    const audio = new SonificationEngine();
    const render = (demonstrating: boolean) => root.render(<Cockpit scenario={SCENARIO} region={UNITED_STATES}
      moduleId="endocrine-metabolic" audio={audio} demonstrating={demonstrating} onEnd={() => {}}
      onTakeControls={() => { take(); render(false); }} />);
    act(() => render(true));
    if (transport === 'paused') {
      const next = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Continue example')!;
      act(() => next.click());
      expect(perform).toHaveBeenCalledExactlyOnceWith({ type: 'hypocalcemia-response', payload: { action: 'calcium-rescue' } });
      engine.apply({ tick: 0, type: 'hypocalcemia-response', payload: { action: 'calcium-rescue' } });
    } else {
      for (const action of ['calcium-rescue', 'assess-risk', 'review-cause', 'magnesium', 'continuing-care', 'call-support']) {
        engine.apply({ tick: 0, type: 'hypocalcemia-response', payload: { action } });
      }
    }
    const frame = engine.step();
    act(() => useSession.setState({ transport, state: frame.state, equipment: frame.equipment, tick: frame.tick }));
    const control = container.querySelector<HTMLButtonElement>(`button[aria-label="${transport === 'paused' ? 'Play' : 'Pause'}"]`)!;
    const takeover = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Take the controls')!;
    const patient = useSession.getState().equipment!.resuscitation.hypocalcemia;
    const tick = useSession.getState().tick;
    const counts = [perform.mock.calls.length, play.mock.calls.length, pause.mock.calls.length];
    takeover.focus(); expect(document.activeElement).toBe(takeover);
    act(() => takeover.click());
    expect(take).toHaveBeenCalledOnce(); expect(container.querySelector('.demo-bar')).toBeNull();
    expect(document.activeElement).toBe(control); expect(control.isConnected).toBe(true);
    expect(useSession.getState().transport).toBe(transport); expect(useSession.getState().tick).toBe(tick);
    expect(useSession.getState().equipment!.resuscitation.hypocalcemia).toBe(patient);
    expect([perform.mock.calls.length, play.mock.calls.length, pause.mock.calls.length]).toEqual(counts);
  });
});
