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
import { RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hyponatremia-symptoms-and-reassessment';
import { RenalHyponatremia, RENAL_HYPONATREMIA_RESCUE_TICKS as INITIAL,
  RENAL_HYPONATREMIA_ADDITIONAL_RESCUE_TICKS as ADDITIONAL } from '../../src/modules/renal-electrolyte/hyponatremia';

vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));
const initialSession = useSession.getState();

describe('Renal hyponatremia nonvisual observation boundaries', () => {
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
  function publish(model: RenalHyponatremia, tick: number) {
    const equipment = useSession.getState().equipment!;
    const vitals = Object.fromEntries(Object.entries(model.vitals())
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
    act(() => useSession.setState({ tick, state: { ...useSession.getState().state!, ...vitals },
      equipment: { ...equipment, resuscitation: { ...equipment.resuscitation, renalHyponatremia: model.snapshot(tick) } },
    }));
  }




  it('speaks seven supplied vitals and historical context without inactive anesthesia equipment', () => {
    const summary = read('s');
    expect(summary).toContain('Supplied sodium was 118 millimoles per liter with confusion, headache, and nausea');
    expect(summary).toContain('No new sodium-only measurement has been requested');
    expect(summary).toContain('No new full sodium, symptom, and bedside assessment');
    for (const value of ['92', '96', '18', '98', '36.7', '132', '78']) expect(summary).toContain(value);
    expect(summary).not.toMatch(/Ventilator:|fresh gas flow|tidal volume|infusions|predicted depth/);
    expect(summary).not.toMatch(/sodium 123|sodium 124/);
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });

  it('does not infer a full response from a sodium-only check', () => {
    const model = new RenalHyponatremia(); model.apply('rescue', 0);
    model.apply('check-sodium', INITIAL); publish(model, INITIAL);
    const summary = read('s');
    expect(summary).toContain('Last requested sodium at simulated 01:00:00: 123');
    expect(summary).toContain('change from the original 118: 5');
    expect(summary).toContain('No new neurologic-only assessment has been requested');
    expect(summary).toContain('No new full sodium, symptom');
    expect(model.snapshot(INITIAL).initialResponseObserved).toBe(false);
  });

  it('keeps a newer neurologic assessment separate from older full sodium findings', () => {
    const model = new RenalHyponatremia(); model.apply('reassess', 0); model.apply('rescue', 0);
    model.advance(INITIAL); model.apply('check-neurology', INITIAL); publish(model, INITIAL);
    const summary = read('s');
    expect(summary).toContain('Last requested neurologic assessment at simulated 01:00:00: awake but confused; headache present; nausea present');
    expect(summary).toContain('Last requested full assessment at simulated 00:00:00: sodium 118');
    expect(summary).not.toContain('sodium 123');
    expect(summary).toContain('A neurologic-only check does not refresh sodium');
    expect(summary).toContain('historical observations, not live measurements');
  });

  it('retains persistent symptoms and the original correction baseline after additional rescue', () => {
    const model = new RenalHyponatremia(); model.apply('rescue', 0); model.apply('reassess', INITIAL);
    model.apply('additional-rescue', INITIAL); model.apply('evaluate-neurology', INITIAL);
    model.apply('check-sodium', INITIAL + ADDITIONAL); publish(model, INITIAL + ADDITIONAL);
    expect(read('s')).toContain('01:30:00: 124');
    expect(read('s')).toContain('01:00:00: sodium 123');
    expect(read('s')).toContain('awake but confused; headache present; nausea present');
    expect(model.snapshot(INITIAL + ADDITIONAL).additionalResponseObserved).toBe(false);
    model.apply('reassess', INITIAL + ADDITIONAL); publish(model, INITIAL + ADDITIONAL);
    const summary = read('s');
    expect(summary).toContain('01:30:00: sodium 124');
    expect(summary).toContain('change from the original 118: 6');
    expect(summary).toContain('awake but confused; headache present; nausea present');
    expect(summary).toContain('not a clinical stopping rule. No treatment is automatically stopped');
    expect(summary).toContain('Expert treatment review, monitoring, and cause evaluation remain active');
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
    const tick = INITIAL + 7 * TICKS_PER_SECOND;
    const model = new RenalHyponatremia(); model.apply('rescue', 0); model.apply('reassess', tick); publish(model, tick);
    expect(read('s')).toContain('at simulated 01:00:07: sodium 123');
    const measure = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Check sodium only')!;
    act(() => measure.click()); expect(perform).toHaveBeenCalledWith({ type: 'renal-hyponatremia-response', payload: { action: 'check-sodium' } });
    const source = container.querySelector<HTMLAnchorElement>('a[href="https://www.endocrinology.org/media/xhrhxhxm/emergency-management-of-severe-and-moderately-severely-symptomatic-hyponatraemia-in-adult-patients-2022.pdf"]')!;
    source.addEventListener('click', (event) => event.preventDefault()); act(() => source.click()); expect(pause).toHaveBeenCalledOnce();
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    expect(container.textContent).not.toMatch(/propofol|Watch a 90-second/i);
  });
});
