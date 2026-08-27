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
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import { RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypokalemia-magnesium-and-ongoing-losses';
import { RenalHypokalemia, RENAL_HYPOKALEMIA_POTASSIUM_TICKS as EARLY,
  RENAL_HYPOKALEMIA_RESPONSE_TICKS as RESPONSE, RENAL_HYPOKALEMIA_RECURRENCE_TICKS as RECURRENCE } from '../../src/modules/renal-electrolyte/hypokalemia';

vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));
const initialSession = useSession.getState();

describe('Renal hypokalemia nonvisual observation boundaries', () => {
  let container: HTMLDivElement; let root: Root;
  const perform = vi.fn(); const play = vi.fn(); const pause = vi.fn();
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1)); vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    const frame = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4922, practiceRegion: 'US' }).step();
    useSession.setState({ ...initialSession, phase: 'running', transport: 'paused', guidance: 'unassisted',
      state: frame.state, equipment: frame.equipment, tick: frame.tick, play, pause, act: perform, alarms: [],
    });
    act(() => root.render(<Cockpit scenario={SCENARIO} region={UNITED_STATES}
      moduleId="renal-electrolyte" audio={new SonificationEngine()} onEnd={() => {}} />));
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); useSession.setState(initialSession, true);
    vi.unstubAllGlobals(); vi.clearAllMocks();
  });
  function read(key: 's' | 'w') {
    act(() => container.querySelector('#monitor-region')!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
    return container.querySelector('.visually-hidden[aria-live="polite"][aria-atomic="true"]')!.textContent!;
  }
  function publish(model: RenalHypokalemia, tick: number) {
    const equipment = useSession.getState().equipment!;
    const vitals = Object.fromEntries(Object.entries(model.vitals())
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
    act(() => useSession.setState({ tick, state: { ...useSession.getState().state!, ...vitals },
      equipment: { ...equipment, resuscitation: { ...equipment.resuscitation, renalHypokalemia: model.snapshot(tick) } },
    }));
  }



  it('speaks seven supplied vitals and historical context without inactive anesthesia equipment', () => {
    const summary = read('s');
    expect(summary).toContain('Supplied potassium was 2.3 and magnesium 0.40 millimoles per liter');
    expect(summary).toContain('No new potassium-only measurement has been requested');
    expect(summary).toContain('No new full potassium, magnesium, ECG, and bedside assessment');
    for (const value of ['96', '79', '18', '98', '36.7', '106', '66']) expect(summary).toContain(value);
    expect(summary).not.toMatch(/Ventilator:|fresh gas flow|tidal volume|infusions|predicted depth/);
    expect(summary).not.toMatch(/potassium 2.7|potassium 3.1|magnesium 0.58|magnesium 0.62/);
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });

  it('keeps magnesium unavailable when only potassium is newly requested', () => {
    const model = new RenalHypokalemia(); model.apply('potassium', 0); model.apply('magnesium', 0);
    model.apply('check-potassium', EARLY); publish(model, EARLY);
    const summary = read('s');
    expect(summary).toContain('Last requested potassium at simulated 00:30:00: 2.7');
    expect(summary).toContain('No new full potassium, magnesium');
    expect(summary).not.toContain('magnesium 0.58');
    expect(summary).toContain('Potassium and magnesium care are independent');
  });

  it('preserves older magnesium beside newer potassium and ECG timestamps', () => {
    const model = new RenalHypokalemia(); model.apply('potassium', 0); model.apply('magnesium', 0); model.apply('reassess', 0);
    model.advance(EARLY); model.apply('check-potassium', EARLY); model.apply('check-ecg', EARLY); publish(model, EARLY);
    const summary = read('s');
    expect(summary).toContain('Last requested potassium at simulated 00:30:00: 2.7');
    expect(summary).toContain('Last requested ECG at simulated 00:30:00: supplied flattened-T pattern');
    expect(summary).toContain('Last requested full assessment at simulated 00:00:00: potassium 2.3, magnesium 0.40');
    expect(summary).not.toContain('magnesium 0.58');
    expect(summary).toContain('A potassium-only check does not refresh magnesium');
    expect(summary).toContain('historical observations, not live measurements');
  });

  it('retains recurrent depletion through partial recovery checks and later full findings', () => {
    const model = new RenalHypokalemia(); model.apply('potassium', 0); model.apply('magnesium', 0); model.apply('reassess', RESPONSE);
    model.advance(RECURRENCE); model.apply('check-potassium', RECURRENCE); publish(model, RECURRENCE);
    expect(read('s')).toContain('02:00:00: 2.5');
    expect(read('s')).toContain('01:00:00: potassium 3.1, magnesium 0.62');
    expect(read('s')).not.toContain('magnesium 0.46');
    model.apply('reassess', RECURRENCE); model.apply('manage-losses', RECURRENCE);
    model.apply('check-potassium', RECURRENCE + RESPONSE); publish(model, RECURRENCE + RESPONSE);
    expect(read('s')).toContain('03:00:00: 3.1'); expect(read('s')).toContain('02:00:00: potassium 2.5, magnesium 0.46');
    model.apply('reassess', RECURRENCE + RESPONSE); publish(model, RECURRENCE + RESPONSE);
    expect(read('s')).toContain('03:00:00: potassium 3.1, magnesium 0.62');
    expect(read('s')).toContain('A full assessment recorded recurrent depletion');
    expect(read('s')).toContain('This waveform supplies no U-wave or QTc measurement');
  });

  it('keeps capnography unavailable without describing a fabricated normal waveform', () => {
    expect(read('w')).toContain('Capnography: Not supplied in this lesson');
    expect(read('w')).not.toMatch(/blood-gas|arterial carbon dioxide|alveolar plateau/);
  });

  it.each(['etco2MmHg', 'fio2'] as const)('does not expose unavailable %s in Why', (field) => {
    act(() => container.querySelector<HTMLButtonElement>(`[data-why-field="${field}"]`)!.click());
    const drawer = container.querySelector('[role="dialog"]')!;
    expect(drawer.querySelector('.numeric')!.textContent).toMatch(/^--\s/);
    expect(drawer.textContent).toContain('separate requested historical observations');
    expect(drawer.textContent).not.toMatch(/own baseline|Ranked contributors/);
  });

  it('suppresses unsupported carbon-dioxide crossings but retains saturation warnings', () => {
    const spoken = () => [...container.querySelectorAll('.visually-hidden[aria-live], .visually-hidden[role="alert"]')]
      .map((node) => node.textContent).join(' ');
    act(() => useSession.setState({ state: { ...useSession.getState().state!, etco2MmHg: 80 } }));
    expect(spoken()).not.toMatch(/end-tidal|carbon dioxide/i);
    act(() => useSession.setState({ state: { ...useSession.getState().state!, spo2Percent: 85 } }));
    expect(spoken()).toContain('Oxygen saturation fell below 90');
  });



  it('uses shared-clock seconds, dedicated actions, and pausing source links without generic induction prompts', () => {
    const tick = EARLY + 7 * TICKS_PER_SECOND;
    const model = new RenalHypokalemia(); model.apply('potassium', 0); model.apply('reassess', tick); publish(model, tick);
    expect(read('s')).toContain('at simulated 00:30:07: potassium 2.7');
    const measure = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Check potassium only')!;
    act(() => measure.click()); expect(perform).toHaveBeenCalledWith({ type: 'renal-hypokalemia-response', payload: { action: 'check-potassium' } });
    const source = container.querySelector<HTMLAnchorElement>('a[href="https://sps.nhs.uk/articles/hypokalaemia/"]')!;
    source.addEventListener('click', (event) => event.preventDefault()); act(() => source.click()); expect(pause).toHaveBeenCalledOnce();
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    expect(container.textContent).not.toMatch(/propofol|Watch a 90-second/i);
  });
});
