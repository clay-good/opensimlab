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
import { RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypocalcemia-ionized-calcium-and-ckd';
import { RenalHypocalcemia, RENAL_HYPOCALCEMIA_RESCUE_TICKS as INITIAL,
  RENAL_HYPOCALCEMIA_CONTINUING_TICKS as CONTINUING } from '../../src/modules/renal-electrolyte/hypocalcemia';

vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));
const initialSession = useSession.getState();

describe('Renal hypocalcemia nonvisual observation boundaries', () => {
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
  function publish(model: RenalHypocalcemia, tick: number) {
    const equipment = useSession.getState().equipment!;
    const vitals = Object.fromEntries(Object.entries(model.vitals())
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
    act(() => useSession.setState({ tick, state: { ...useSession.getState().state!, ...vitals },
      equipment: { ...equipment, resuscitation: { ...equipment.resuscitation, renalHypocalcemia: model.snapshot(tick) } },
    }));
  }




  it('speaks seven supplied vitals and historical context without inactive anesthesia equipment', () => {
    const summary = read('s');
    expect(summary).toContain('Supplied measured ionized calcium was 0.86 millimoles per liter at pH 7.40');
    expect(summary).toContain('No new ionized-calcium-only measurement has been requested');
    expect(summary).toContain('No new full ionized-calcium, symptom, and bedside assessment');
    for (const value of ['102', '98', '22', '36.8', '138', '78']) expect(summary).toContain(value);
    expect(summary).not.toMatch(/Ventilator:|fresh gas flow|tidal volume|infusions|predicted depth/);
    expect(summary).not.toMatch(/ionized calcium 0.96|ionized calcium 1.03/);
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });

  it('does not infer a full response or symptom relief from an ionized-only check', () => {
    const model = new RenalHypocalcemia(); model.apply('rescue-calcium', 0);
    model.apply('check-ionized', INITIAL); publish(model, INITIAL);
    const summary = read('s');
    expect(summary).toContain('Last requested ionized calcium at simulated 00:15:00: 0.96');
    expect(summary).toContain('No new symptom-only assessment has been requested');
    expect(summary).toContain('No new full ionized-calcium, symptom');
    expect(summary).not.toContain('carpopedal spasm absent');
    expect(model.snapshot(INITIAL).rescueResponseObserved).toBe(false);
  });

  it('keeps newer symptom findings separate from older full ionized calcium', () => {
    const model = new RenalHypocalcemia(); model.apply('reassess', 0); model.apply('rescue-calcium', 0);
    model.apply('check-symptoms', INITIAL); publish(model, INITIAL);
    const summary = read('s');
    expect(summary).toContain('Last requested symptoms at simulated 00:15:00: carpopedal spasm absent; perioral tingling present');
    expect(summary).toContain('Last requested full assessment at simulated 00:00:00: ionized calcium 0.86');
    expect(summary).not.toContain('ionized calcium 0.96');
    expect(summary).toContain('A symptom-only check does not refresh calcium');
    expect(summary).toContain('historical observations, not live measurements');
  });

  it('retains recurrence history and tingling through continuing treatment without inventing QT or mineral recovery', () => {
    const model = new RenalHypocalcemia(); model.apply('rescue-calcium', 0);
    model.apply('reassess', INITIAL * 3); model.apply('continue-calcium', INITIAL * 3);
    model.apply('check-ionized', INITIAL * 3 + CONTINUING); publish(model, INITIAL * 3 + CONTINUING);
    expect(read('s')).toContain('01:45:00: 1.03'); expect(read('s')).toContain('00:45:00: ionized calcium 0.88');
    expect(read('s')).toContain('carpopedal spasm present; perioral tingling present');
    expect(model.snapshot(INITIAL * 3 + CONTINUING).continuingResponseObserved).toBe(false);
    model.apply('reassess', INITIAL * 3 + CONTINUING); publish(model, INITIAL * 3 + CONTINUING);
    const summary = read('s');
    expect(summary).toContain('01:45:00: ionized calcium 1.03');
    expect(summary).toContain('carpopedal spasm absent; perioral tingling present');
    expect(summary).toContain('A full assessment recorded recurrence without continuing calcium care');
    expect(summary).toContain('The supplied QTc is historical and is not measured by the waveform');
    expect(summary).toContain('Symptom relief does not establish durable correction');
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
    const model = new RenalHypocalcemia(); model.apply('rescue-calcium', 0); model.apply('reassess', tick); publish(model, tick);
    expect(read('s')).toContain('at simulated 00:15:07: ionized calcium 0.96');
    const measure = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Check ionized calcium only')!;
    act(() => measure.click()); expect(perform).toHaveBeenCalledWith({ type: 'renal-hypocalcemia-response', payload: { action: 'check-ionized' } });
    const source = container.querySelector<HTMLAnchorElement>('a[href="https://www.fda.gov/drugs/drug-safety-communications/fda-adds-boxed-warning-increased-risk-severe-hypocalcemia-patients-advanced-chronic-kidney-disease"]')!;
    source.addEventListener('click', (event) => event.preventDefault()); act(() => source.click()); expect(pause).toHaveBeenCalledOnce();
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    expect(container.textContent).not.toMatch(/propofol|Watch a 90-second/i);
  });
});
