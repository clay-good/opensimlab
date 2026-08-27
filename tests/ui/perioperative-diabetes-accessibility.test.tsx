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
import { PERIOPERATIVE_DIABETES_INSULIN_CONTINUITY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/perioperative-diabetes-insulin-continuity';
import { PerioperativeDiabetes, PERIOPERATIVE_DIABETES_EARLY_TICKS as EARLY,
  PERIOPERATIVE_DIABETES_RESPONSE_TICKS as RESPONSE, PERIOPERATIVE_DIABETES_DELAY_TICKS as DELAY,
  PERIOPERATIVE_DIABETES_WORSENING_TICKS as WORSENING } from '../../src/modules/endocrine-metabolic/perioperative-diabetes';

vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));
const initialSession = useSession.getState();

describe('Perioperative diabetes nonvisual observation boundaries', () => {
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
  function publish(model: PerioperativeDiabetes, tick: number) {
    const equipment = useSession.getState().equipment!;
    const vitals = Object.fromEntries(Object.entries(model.vitals())
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
    act(() => useSession.setState({ tick, state: { ...useSession.getState().state!, ...vitals },
      equipment: { ...equipment, resuscitation: { ...equipment.resuscitation, perioperativeDiabetes: model.snapshot(tick) } },
    }));
  }

  it('speaks the seven supplied vitals and historical context without inactive anesthesia equipment', () => {
    const summary = read('s');
    expect(summary).toContain('Supplied glucose was 180 milligrams per deciliter and blood ketones 0.6 millimoles per liter');
    expect(summary).toContain('No new blood-glucose measurement has been requested');
    expect(summary).toContain('No new full glucose, ketone, and bedside assessment has been requested');
    for (const value of ['88', '87', '16', '98', '36.7', '118', '72']) expect(summary).toContain(value);
    expect(summary).not.toMatch(/Ventilator:|fresh gas flow|tidal volume|infusions|predicted depth/);
    expect(summary).not.toMatch(/240|280|ketones 1.2|ketones 2.0/);
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });

  it('does not infer ketones or a full deterioration observation from a glucose-only check', () => {
    const model = new PerioperativeDiabetes(); model.advance(DELAY); publish(model, DELAY);
    expect(read('s')).not.toMatch(/240|ketones 1.2/);
    model.apply('check-glucose', DELAY); publish(model, DELAY);
    const summary = read('s');
    expect(summary).toContain('Last requested blood glucose at simulated 00:30:00: 240');
    expect(summary).toContain('No new full glucose, ketone, and bedside assessment');
    expect(summary).not.toMatch(/ketones 1.2|recorded deterioration/);
  });

  it('retains an older full ketone result beside a newer blood-glucose timestamp', () => {
    const model = new PerioperativeDiabetes(); model.apply('reassess', DELAY); model.advance(WORSENING);
    model.apply('check-glucose', WORSENING); publish(model, WORSENING);
    const summary = read('s');
    expect(summary).toContain('Last requested blood glucose at simulated 01:00:00: 280');
    expect(summary).toContain('Last requested full assessment at simulated 00:30:00: glucose 240 milligrams per deciliter and blood ketones 1.2');
    expect(summary).not.toContain('ketones 2.0');
    expect(summary).toContain('A glucose-only check does not refresh ketones');
    expect(summary).toContain('historical observations, not live measurements');
  });

  it('retains old full findings until a later full request and never implies automatic surgical clearance', () => {
    const model = new PerioperativeDiabetes(); model.apply('restore-insulin', 0); model.apply('reassess', EARLY);
    model.advance(RESPONSE); model.apply('check-glucose', RESPONSE); publish(model, RESPONSE);
    expect(read('s')).toContain('01:00:00: 144');
    expect(read('s')).toContain('00:30:00: glucose 162 milligrams per deciliter and blood ketones 0.4');
    expect(read('s')).not.toContain('ketones 0.3'); expect(model.snapshot(RESPONSE).responseObserved).toBe(false);
    model.apply('reassess', RESPONSE); publish(model, RESPONSE);
    const summary = read('s');
    expect(summary).toContain('01:00:00: glucose 144 milligrams per deciliter and blood ketones 0.3');
    expect(summary).toContain('does not establish the full response, diagnose or exclude ketoacidosis, or automatically clear surgery');
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
    const model = new PerioperativeDiabetes(); model.apply('restore-insulin', 0); model.apply('reassess', tick); publish(model, tick);
    expect(read('s')).toContain('at simulated 00:30:07: glucose 162');
    const measure = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Check blood glucose only')!;
    act(() => measure.click()); expect(perform).toHaveBeenCalledWith({ type: 'perioperative-diabetes-response', payload: { action: 'check-glucose' } });
    const source = container.querySelector<HTMLAnchorElement>('a[href="https://doi.org/10.2337/dc26-S016"]')!;
    source.addEventListener('click', (event) => event.preventDefault()); act(() => source.click()); expect(pause).toHaveBeenCalledOnce();
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    expect(container.textContent).not.toMatch(/propofol|Watch a 90-second/i);
  });
});
