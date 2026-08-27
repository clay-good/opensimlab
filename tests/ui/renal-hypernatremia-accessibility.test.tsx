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
import { RENAL_HYPERNATREMIA_WATER_ACCESS_AND_LOSSES as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypernatremia-water-access-and-losses';
import { RenalHypernatremia, RENAL_HYPERNATREMIA_VOLUME_TICKS as INITIAL,
  RENAL_HYPERNATREMIA_COMBINED_TICKS as COMBINED } from '../../src/modules/renal-electrolyte/hypernatremia';

vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));
const initialSession = useSession.getState();

describe('Renal hypernatremia nonvisual observation boundaries', () => {
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
  function publish(model: RenalHypernatremia, tick: number) {
    const equipment = useSession.getState().equipment!;
    const vitals = Object.fromEntries(Object.entries(model.vitals())
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
    act(() => useSession.setState({ tick, state: { ...useSession.getState().state!, ...vitals },
      equipment: { ...equipment, resuscitation: { ...equipment.resuscitation, renalHypernatremia: model.snapshot(tick) } },
    }));
  }




  it('speaks seven supplied vitals and historical context without inactive anesthesia equipment', () => {
    const summary = read('s');
    expect(summary).toContain('Supplied sodium was 164 millimoles per liter');
    expect(summary).toContain('No new sodium-only measurement has been requested');
    expect(summary).toContain('No new full sodium, fluid-balance, and bedside assessment');
    for (const value of ['112', '64', '20', '98', '37.1', '88', '52']) expect(summary).toContain(value);
    expect(summary).not.toMatch(/Ventilator:|fresh gas flow|tidal volume|infusions|predicted depth/);
    expect(summary).not.toMatch(/sodium 163|sodium 162/);
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });

  it('does not infer a full response or new urine output from a sodium-only check', () => {
    const model = new RenalHypernatremia(); model.apply('restore-volume', 0); model.apply('replace-water', INITIAL);
    model.apply('check-sodium', INITIAL + COMBINED / 2); publish(model, INITIAL + COMBINED / 2);
    const summary = read('s');
    expect(summary).toContain('Last requested sodium at simulated 02:15:00: 163');
    expect(summary).toContain('change from the original 164: -1');
    expect(summary).toContain('No new fluid-balance-only assessment has been requested');
    expect(summary).toContain('No new full sodium, fluid-balance');
    expect(summary).not.toContain('urine output 35');
    expect(model.snapshot(INITIAL + COMBINED / 2).waterResponseObserved).toBe(false);
  });

  it('keeps newer fluid balance separate from older full sodium findings', () => {
    const model = new RenalHypernatremia(); model.apply('reassess', 0); model.apply('restore-volume', 0);
    model.apply('replace-water', INITIAL); model.apply('check-fluid-balance', INITIAL + COMBINED / 2); publish(model, INITIAL + COMBINED / 2);
    const summary = read('s');
    expect(summary).toContain('Last requested fluid balance at simulated 02:15:00: urine output 35 milliliters per hour; ongoing diarrhea present');
    expect(summary).toContain('Last requested full assessment at simulated 00:00:00: sodium 164');
    expect(summary).not.toContain('sodium 163');
    expect(summary).toContain('A fluid-balance-only check does not refresh sodium');
    expect(summary).toContain('historical observations, not live measurements');
  });

  it('retains recurrence history and continuing diarrhea through later combined care', () => {
    const model = new RenalHypernatremia(); model.apply('restore-volume', 0); model.apply('replace-water', INITIAL);
    model.apply('reassess', INITIAL + COMBINED); model.apply('manage-losses', INITIAL + COMBINED);
    model.apply('check-sodium', INITIAL + COMBINED * 2); publish(model, INITIAL + COMBINED * 2);
    expect(read('s')).toContain('08:15:00: 162'); expect(read('s')).toContain('04:15:00: sodium 164');
    expect(read('s')).toContain('ongoing diarrhea present');
    expect(model.snapshot(INITIAL + COMBINED * 2).combinedResponseObserved).toBe(false);
    model.apply('reassess', INITIAL + COMBINED * 2); publish(model, INITIAL + COMBINED * 2);
    const summary = read('s');
    expect(summary).toContain('08:15:00: sodium 162'); expect(summary).toContain('change from the original 164: -2');
    expect(summary).toContain('A full assessment recorded recurrence with continuing losses');
    expect(summary).toContain('does not instantly stop diarrhea or prove durable recovery');
  });

  it('keeps capnography unavailable without describing a fabricated normal waveform', () => {
    expect(read('w')).toContain('Capnography: Not supplied in this lesson');
    expect(read('w')).not.toMatch(/blood-gas|arterial carbon dioxide|alveolar plateau/);
  });

  it.each(['etco2MmHg', 'fio2'] as const)('does not expose unavailable %s in Why', (field) => {
    act(() => container.querySelector<HTMLButtonElement>(`[data-why-field="${field}"]`)!.click());
    const drawer = container.querySelector('[role="dialog"]')!;
    expect(drawer.querySelector('.numeric')!.textContent).toMatch(/^--\s/);
    expect(drawer.textContent).toContain('separate historical timestamps');
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
    const tick = INITIAL + 7 * TICKS_PER_SECOND;
    const model = new RenalHypernatremia(); model.apply('restore-volume', 0); model.apply('reassess', tick); publish(model, tick);
    expect(read('s')).toContain('at simulated 00:15:07: sodium 164');
    const measure = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Check sodium only')!;
    act(() => measure.click()); expect(perform).toHaveBeenCalledWith({ type: 'renal-hypernatremia-response', payload: { action: 'check-sodium' } });
    const source = container.querySelector<HTMLAnchorElement>('a[href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10175862/"]')!;
    source.addEventListener('click', (event) => event.preventDefault()); act(() => source.click()); expect(pause).toHaveBeenCalledOnce();
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    expect(container.textContent).not.toMatch(/propofol|Watch a 90-second/i);
  });
});
