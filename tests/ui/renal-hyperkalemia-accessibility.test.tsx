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
import { RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hyperkalemia-cardioprotection-and-rebound';
import { RenalHyperkalemia, RENAL_HYPERKALEMIA_SHIFT_TICKS as EARLY,
  RENAL_HYPERKALEMIA_REMOVAL_TICKS as RESPONSE, RENAL_HYPERKALEMIA_REBOUND_TICKS as REBOUND } from '../../src/modules/renal-electrolyte/hyperkalemia';

vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));
const initialSession = useSession.getState();

describe('Renal hyperkalemia nonvisual observation boundaries', () => {
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
  function publish(model: RenalHyperkalemia, tick: number) {
    const equipment = useSession.getState().equipment!;
    const vitals = Object.fromEntries(Object.entries(model.vitals())
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
    act(() => useSession.setState({ tick, state: { ...useSession.getState().state!, ...vitals },
      equipment: { ...equipment, resuscitation: { ...equipment.resuscitation, renalHyperkalemia: model.snapshot(tick) } },
    }));
  }


  it('speaks seven supplied vitals and historical context without inactive anesthesia equipment', () => {
    const summary = read('s');
    expect(summary).toContain('Supplied potassium was 6.9 millimoles per liter and blood glucose 108');
    expect(summary).toContain('No new ECG assessment has been requested');
    expect(summary).toContain('No new full potassium, glucose, ECG, and bedside assessment');
    for (const value of ['48', '79', '18', '98', '36.7', '110', '64']) expect(summary).toContain(value);
    expect(summary).not.toMatch(/Ventilator:|fresh gas flow|tidal volume|infusions|predicted depth/);
    expect(summary).not.toMatch(/potassium 5.6|potassium 5.1|potassium 6.6/);
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });

  it('describes requested calcium-related ECG improvement without inventing potassium reduction', () => {
    const model = new RenalHyperkalemia(); model.apply('calcium', 0); model.apply('check-ecg', 1); publish(model, 1);
    const summary = read('s');
    expect(summary).toContain('Last requested ECG at simulated 00:00:00: authored ECG improvement');
    expect(summary).toContain('Calcium does not lower potassium');
    expect(summary).toContain('No new full potassium');
    expect(summary).not.toContain('potassium 5.6');
  });

  it('preserves old potassium beside newer glucose and ECG timestamps', () => {
    const model = new RenalHyperkalemia(); model.apply('shift', 0); model.apply('reassess', 0);
    model.advance(EARLY); model.apply('check-glucose', EARLY); model.apply('check-ecg', EARLY); publish(model, EARLY);
    const summary = read('s');
    expect(summary).toContain('Last requested blood glucose at simulated 00:30:00: 104');
    expect(summary).toContain('Last requested ECG at simulated 00:30:00: authored ECG improvement');
    expect(summary).toContain('Last requested full assessment at simulated 00:00:00: potassium 6.9');
    expect(summary).not.toContain('potassium 5.6');
    expect(summary).toContain('A glucose-only check does not refresh potassium');
    expect(summary).toContain('historical observations, not live measurements');
  });

  it('does not infer rebound from an ECG-only check or erase rebound after later removal', () => {
    const model = new RenalHyperkalemia(); model.apply('shift', 0); model.apply('reassess', EARLY);
    model.advance(REBOUND); model.apply('check-ecg', REBOUND); publish(model, REBOUND);
    expect(read('s')).toContain('02:30:00: supplied conduction abnormality');
    expect(read('s')).toContain('00:30:00: potassium 5.6');
    expect(read('s')).not.toContain('potassium 6.6');
    model.apply('reassess', REBOUND); model.apply('deliver-removal', REBOUND); model.advance(REBOUND + RESPONSE);
    model.apply('check-glucose', REBOUND + RESPONSE); publish(model, REBOUND + RESPONSE);
    expect(read('s')).toContain('03:30:00: 100'); expect(read('s')).toContain('02:30:00: potassium 6.6');
    expect(read('s')).not.toContain('potassium 5.1');
    model.apply('reassess', REBOUND + RESPONSE); publish(model, REBOUND + RESPONSE);
    expect(read('s')).toContain('03:30:00: potassium 5.1');
    expect(read('s')).toContain('A full assessment recorded rebound');
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
    const model = new RenalHyperkalemia(); model.apply('shift', 0); model.apply('reassess', tick); publish(model, tick);
    expect(read('s')).toContain('at simulated 00:30:07: potassium 5.6');
    const measure = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Check ECG only')!;
    act(() => measure.click()); expect(perform).toHaveBeenCalledWith({ type: 'renal-hyperkalemia-response', payload: { action: 'check-ecg' } });
    const source = container.querySelector<HTMLAnchorElement>('a[href="https://www.ukkidney.org/health-professionals/guidelines/treatment-acute-hyperkalaemia-adults-0"]')!;
    source.addEventListener('click', (event) => event.preventDefault()); act(() => source.click()); expect(pause).toHaveBeenCalledOnce();
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    expect(container.textContent).not.toMatch(/propofol|Watch a 90-second/i);
  });
});
