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
import { RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypermagnesemia-antagonism-and-removal';
import { RenalHypermagnesemia, RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS as CALCIUM,
  RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS as REMOVAL } from '../../src/modules/renal-electrolyte/hypermagnesemia';

vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));
const initialSession = useSession.getState();

describe('Renal hypermagnesemia nonvisual observation boundaries', () => {
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
  function publish(model: RenalHypermagnesemia, tick: number) {
    const equipment = useSession.getState().equipment!;
    const vitals = Object.fromEntries(Object.entries(model.vitals())
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
    act(() => useSession.setState({ tick, state: { ...useSession.getState().state!, ...vitals },
      equipment: { ...equipment, resuscitation: { ...equipment.resuscitation, renalHypermagnesemia: model.snapshot(tick) } },
    }));
  }




  it('speaks seven supplied vitals and historical context without inactive anesthesia equipment', () => {
    const summary = read('s');
    expect(summary).toContain('Supplied magnesium was 4.6 millimoles per liter');
    expect(summary).toContain('No new magnesium-only measurement has been requested');
    expect(summary).toContain('No new full magnesium, neuromuscular, and bedside assessment');
    for (const value of ['44', '86', '48', '61', '8', '90', '36.3']) expect(summary).toContain(value);
    expect(summary).not.toMatch(/Ventilator:|fresh gas flow|tidal volume|infusions|predicted depth/);
    expect(summary).not.toContain('magnesium 2.4');
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });

  it('distinguishes supported breathing and temporary circulation improvement from magnesium clearance', () => {
    const model = new RenalHypermagnesemia(); model.apply('support-breathing', 0); model.apply('calcium', 0);
    model.apply('check-magnesium', 10); publish(model, 10);
    const summary = read('s');
    expect(summary).toContain('00:00:01: 4.6');
    expect(summary).toContain('displayed respiratory rate is supported, not proof of independent breathing');
    expect(summary).toContain('Calcium temporarily counters toxicity without removing magnesium');
    expect(summary).toContain('No new neuromuscular-only assessment has been requested');
    expect(summary).toContain('No new full magnesium, neuromuscular');
    expect(model.snapshot(10).calciumResponseObserved).toBe(false);
  });

  it('keeps newer neuromuscular findings separate from older full magnesium findings', () => {
    const model = new RenalHypermagnesemia(); model.apply('reassess', 0); model.apply('deliver-removal', 0);
    model.apply('check-neuromuscular', REMOVAL); publish(model, REMOVAL);
    const summary = read('s');
    expect(summary).toContain('01:00:00: reflexes present; residual weakness persists');
    expect(summary).toContain('00:00:00: magnesium 4.6');
    expect(summary).not.toContain('magnesium 2.4');
    expect(summary).toContain('A neuromuscular-only check does not refresh magnesium');
    expect(summary).toContain('historical observations, not live measurements');
  });

  it('retains recurrent toxicity history and supported breathing after removal without inventing magnesium rebound', () => {
    const model = new RenalHypermagnesemia(); model.apply('support-breathing', 0); model.apply('calcium', 0); model.apply('deliver-removal', 0);
    model.apply('reassess', CALCIUM); publish(model, CALCIUM);
    expect(read('s')).toContain('00:30:00: magnesium 4.6');
    expect(read('s')).toContain('recurrent clinical toxicity, not a new magnesium rise');
    model.apply('check-magnesium', REMOVAL); publish(model, REMOVAL);
    expect(read('s')).toContain('01:00:00: 2.4'); expect(read('s')).toContain('00:30:00: magnesium 4.6');
    expect(model.snapshot(REMOVAL).removalResponseObserved).toBe(false);
    model.apply('reassess', REMOVAL); publish(model, REMOVAL);
    const summary = read('s');
    expect(summary).toContain('01:00:00: magnesium 2.4'); expect(summary).toContain('reflexes present; residual weakness persists');
    expect(summary).toContain('recurrent clinical toxicity, not a new magnesium rise');
    expect(summary).toContain('does not establish durable recovery or authorize withdrawal of support');
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
    const tick = CALCIUM + 7 * TICKS_PER_SECOND;
    const model = new RenalHypermagnesemia(); model.apply('calcium', 0); model.apply('reassess', tick); publish(model, tick);
    expect(read('s')).toContain('at simulated 00:30:07: magnesium 4.6');
    const measure = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Check magnesium only')!;
    act(() => measure.click()); expect(perform).toHaveBeenCalledWith({ type: 'renal-hypermagnesemia-response', payload: { action: 'check-magnesium' } });
    const source = container.querySelector<HTMLAnchorElement>('a[href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6028801/"]')!;
    source.addEventListener('click', (event) => event.preventDefault()); act(() => source.click()); expect(pause).toHaveBeenCalledOnce();
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    expect(container.textContent).not.toMatch(/propofol|Watch a 90-second/i);
  });
});
