/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cockpit } from '@anesthesia/ui/Cockpit';
import type { StateField } from '@anesthesia/physiology';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SonificationEngine } from '@platform/audio/sonification';
import { useSession } from '@platform/session/session-store';
import { MYXEDEMA_COMA_VENTILATION_AND_STEROID_SEQUENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/myxedema-coma-ventilation-and-steroid-sequence';
import { MYXEDEMA_VENTILATION_TICKS } from '../../src/modules/endocrine-metabolic/myxedema';

// Exercise real Cockpit keyboard handling, store subscription, and live regions;
// the canvas-rendering regions do not participate in the spoken output.
vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));

const initialSession = useSession.getState();

describe('Myxedema nonvisual care and monitor boundaries', () => {
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

  function mount(engine: AnesthesiaEngine, scenario = SCENARIO) {
    const frame = engine.step();
    useSession.setState({ ...initialSession, phase: 'running', transport: 'paused', guidance: 'unassisted',
      state: frame.state, equipment: frame.equipment, tick: frame.tick, play, pause, act: perform, alarms: [],
    });
    act(() => root.render(<Cockpit scenario={scenario} region={UNITED_STATES}
      moduleId={scenario === SCENARIO ? 'endocrine-metabolic' : 'anesthesia'} audio={new SonificationEngine()} onEnd={() => {}} />));
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

  it('speaks not-yet-started authored care without inventing a PaCO₂ observation', () => {
    mount(new AnesthesiaEngine({ scenario: SCENARIO, seed: 4904, practiceRegion: 'US' }));
    const summary = read('s');
    expect(summary).toContain('Authored qualified ventilation support: not yet started');
    expect(summary).toContain('No bedside PaCO₂ reassessment has been requested');
    expect(summary).not.toContain('68 millimeters of mercury');
    expectNoGenericEquipment(summary);
  });

  it('speaks accepted qualified ventilation without claiming the generic ventilator is stopped', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4904, practiceRegion: 'US' });
    engine.apply({ tick: 0, type: 'myxedema-response', payload: { action: 'ventilate' } });
    const frame = mount(engine); expect(frame.equipment.resuscitation.myxedema?.ventilationAtTick).toBe(0);
    const summary = read('s');
    expect(summary).toContain('Authored qualified ventilation support: started');
    expect(summary).toContain('Oxygen settings and exhaled carbon dioxide are not supplied');
    expectNoGenericEquipment(summary);
  });

  it('reads only the last requested blood-gas result even after current carbon dioxide changes', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4904, practiceRegion: 'US' });
    engine.apply({ tick: 0, type: 'myxedema-response', payload: { action: 'reassess' } });
    engine.apply({ tick: 0, type: 'myxedema-response', payload: { action: 'ventilate' } });
    for (let tick = 0; tick < MYXEDEMA_VENTILATION_TICKS; tick++) engine.step();
    const frame = mount(engine); expect(frame.state.paco2MmHg).toBe(54);
    const summary = read('s');
    expect(summary).toContain('Last requested bedside PaCO₂ at simulated 00:00:00: 68 millimeters of mercury');
    expect(summary).toContain('historical observation, not a live measurement');
    expect(summary).not.toContain('54 millimeters of mercury');
    expectNoGenericEquipment(summary);
  });

  it('updates the spoken blood-gas value only after a new explicit reassessment', () => {
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4904, practiceRegion: 'US' });
    engine.apply({ tick: 0, type: 'myxedema-response', payload: { action: 'ventilate' } });
    for (let tick = 0; tick < MYXEDEMA_VENTILATION_TICKS; tick++) engine.step();
    engine.apply({ tick: MYXEDEMA_VENTILATION_TICKS, type: 'myxedema-response', payload: { action: 'reassess' } });
    mount(engine); const summary = read('s');
    expect(summary).toContain('Last requested bedside PaCO₂ at simulated 00:05:00: 54 millimeters of mercury');
    expect(summary).toContain('Supported improvement is not independent breathing or recovery');
    expectNoGenericEquipment(summary);
  });

  it('does not describe an unsupported capnogram through the W shortcut', () => {
    mount(new AnesthesiaEngine({ scenario: SCENARIO, seed: 4904, practiceRegion: 'US' }));
    const summary = read('w');
    expect(summary).toContain('Capnography: Not supplied in this lesson');
    expect(summary).not.toMatch(/rectangular|alveolar plateau|alpha angle|No waveform: no gas is moving/);
    expect(summary).toContain('Electrocardiogram'); expect(summary).toContain('Plethysmogram');
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });

  it('keeps hidden EtCO₂ threshold crossings silent while announcing supplied oxygen-saturation changes', () => {
    mount(new AnesthesiaEngine({ scenario: SCENARIO, seed: 4904, practiceRegion: 'US' }));
    const spoken = () => [...container.querySelectorAll('.visually-hidden[aria-live], .visually-hidden[role="alert"]')]
      .map((region) => region.textContent).join(' ');
    act(() => useSession.setState({ state: { ...useSession.getState().state!, etco2MmHg: 80 } }));
    expect(spoken()).not.toMatch(/end-tidal|carbon dioxide/i);
    act(() => useSession.setState({ state: { ...useSession.getState().state!, spo2Percent: 85 } }));
    expect(spoken()).toContain('Oxygen saturation fell below 90');
    expect(spoken()).toContain('now 85');
    expect(spoken()).not.toMatch(/end-tidal|carbon dioxide/i);
  });

  it.each(['etco2MmHg', 'fio2'] as const)('keeps hidden %s values hidden in the real Why drawer', (field) => {
    mount(new AnesthesiaEngine({ scenario: SCENARIO, seed: 4904, practiceRegion: 'US' }));
    act(() => container.querySelector<HTMLButtonElement>(`[data-why-field="${field}"]`)!.click());
    const drawer = container.querySelector('[role="dialog"]')!;
    expect(drawer.querySelector('.numeric')!.textContent).toMatch(/^--\s/);
    expect(drawer.textContent).toContain('These are authored teaching states, not predicted physiology or treatment kinetics');
    expect(drawer.textContent).not.toMatch(/own baseline|Ranked contributors/);
  });

  it('keeps a supplied authored value in the Why drawer without generic attribution claims', () => {
    mount(new AnesthesiaEngine({ scenario: SCENARIO, seed: 4904, practiceRegion: 'US' }));
    act(() => container.querySelector<HTMLButtonElement>('[data-why-field="heartRateBpm"]')!.click());
    const drawer = container.querySelector('[role="dialog"]')!;
    expect(drawer.querySelector('.numeric')!.textContent).toMatch(/^42\s/);
    expect(drawer.textContent).toContain('These are authored teaching states');
    expect(drawer.textContent).not.toMatch(/own baseline|Ranked contributors/);
  });

  it('preserves generic anesthesia equipment and waveform summaries for other scenarios', () => {
    mount(new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION, seed: 1, practiceRegion: 'US' }), ROUTINE_INDUCTION);
    const summary = read('s'); expect(summary).toContain('Ventilator:'); expect(summary).toContain('inspired oxygen fraction');
    expect(summary).toContain('No infusions running'); expect(summary).toContain('Carbon-dioxide sampling line connected');
    expect(summary).not.toContain('Authored qualified ventilation support');
    const waveforms = read('w'); expect(waveforms).toContain('Normal rectangular shape');
    expect(waveforms).not.toContain('Not supplied in this lesson');
  });
});
