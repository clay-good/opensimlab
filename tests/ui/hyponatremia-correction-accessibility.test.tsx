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
import { HYPONATREMIA_AQUARESIS_AND_OVERCORRECTION as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hyponatremia-aquaresis-and-overcorrection';
import { HyponatremiaCorrection } from '../../src/modules/endocrine-metabolic/hyponatremia-correction';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';

vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));
const initialSession = useSession.getState();
const MINUTE = 60 * TICKS_PER_SECOND;

describe('Post-rescue sodium nonvisual observation boundaries', () => {
  let container: HTMLDivElement; let root: Root;
  const perform = vi.fn(); const play = vi.fn(); const pause = vi.fn();
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1)); vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    const frame = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4907, practiceRegion: 'US' }).step();
    useSession.setState({ ...initialSession, phase: 'running', transport: 'paused', guidance: 'unassisted',
      state: frame.state, equipment: frame.equipment, tick: frame.tick, play, pause, act: perform, alarms: [],
    });
    act(() => root.render(<Cockpit scenario={SCENARIO} region={UNITED_STATES}
      moduleId="endocrine-metabolic" audio={new SonificationEngine()} onEnd={() => {}} />));
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); useSession.setState(initialSession, true);
    vi.unstubAllGlobals(); vi.clearAllMocks();
  });
  function read(key: 's' | 'w') {
    act(() => container.querySelector('#monitor-region')!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
    return container.querySelector('.visually-hidden[aria-live="polite"][aria-atomic="true"]')!.textContent!;
  }
  function publish(model: HyponatremiaCorrection, tick: number) {
    const equipment = useSession.getState().equipment!;
    act(() => useSession.setState({ tick, equipment: { ...equipment,
      resuscitation: { ...equipment.resuscitation, hyponatremiaCorrection: model.snapshot(tick) },
    } }));
  }
  it('preserves the original baseline without inventing a requested result or equipment', () => {
    const summary = read('s');
    expect(summary).toContain('106 millimoles per liter, one hour before this lesson');
    expect(summary).toContain('No sodium and urine-output reassessment has been requested');
    expect(summary).toContain('Highest observed sodium: 111');
    expect(summary).not.toMatch(/Ventilator:|fresh gas flow|tidal volume|infusions|predicted depth/);
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });
  it('keeps the last result historical until requested and retains the observed peak after relowering', () => {
    const model = new HyponatremiaCorrection(); model.apply('reassess', 0); model.advance(60 * MINUTE);
    publish(model, 60 * MINUTE);
    expect(read('s')).toContain('at simulated 00:00:00: sodium 111');
    expect(read('s')).not.toMatch(/115|350/);
    model.apply('reassess', 60 * MINUTE); publish(model, 60 * MINUTE);
    expect(read('s')).toContain('at simulated 01:00:00: sodium 115');
    model.apply('relower', 60 * MINUTE); model.apply('control-water-loss', 60 * MINUTE);
    model.advance(120 * MINUTE); model.apply('reassess', 120 * MINUTE); publish(model, 120 * MINUTE);
    const summary = read('s');
    expect(summary).toContain('sodium 112'); expect(summary).toContain('Highest observed sodium: 115');
    expect(summary).toContain('historical observations, not live measurements');
    expect(summary).toContain('Relowering does not erase the correction history');
  });
  it('describes unavailable capnography without inventing an arterial gas', () => {
    expect(read('w')).toContain('Capnography: Not supplied in this lesson');
    expect(read('w')).not.toMatch(/blood-gas|arterial carbon dioxide|alveolar plateau/);
  });
  it.each(['etco2MmHg', 'fio2'] as const)('does not expose unavailable %s in Why', (field) => {
    act(() => container.querySelector<HTMLButtonElement>(`[data-why-field="${field}"]`)!.click());
    const drawer = container.querySelector('[role="dialog"]')!;
    expect(drawer.querySelector('.numeric')!.textContent).toMatch(/^--\s/);
    expect(drawer.textContent).toContain('requested historical observations');
    expect(drawer.textContent).not.toMatch(/own baseline|Ranked contributors/);
  });
  it('silences unsupported carbon-dioxide crossings while retaining saturation announcements', () => {
    const spoken = () => [...container.querySelectorAll('.visually-hidden[aria-live], .visually-hidden[role="alert"]')].map((node) => node.textContent).join(' ');
    act(() => useSession.setState({ state: { ...useSession.getState().state!, etco2MmHg: 80 } }));
    expect(spoken()).not.toMatch(/end-tidal|carbon dioxide/i);
    act(() => useSession.setState({ state: { ...useSession.getState().state!, spo2Percent: 85 } }));
    expect(spoken()).toContain('Oxygen saturation fell below 90');
  });
});
