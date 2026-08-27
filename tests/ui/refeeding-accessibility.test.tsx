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
import { REFEEDING_ELECTROLYTE_SHIFT as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/refeeding-electrolyte-shift';
import { Refeeding, REFEEDING_ELECTROLYTE_TICKS as EARLY, REFEEDING_RECURRENCE_TICKS as RECURRENCE,
  REFEEDING_RESPONSE_TICKS as RESPONSE } from '../../src/modules/endocrine-metabolic/refeeding';

vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));
const initialSession = useSession.getState();

describe('Refeeding nonvisual observation boundaries', () => {
  let container: HTMLDivElement; let root: Root;
  const perform = vi.fn(); const play = vi.fn(); const pause = vi.fn();
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1)); vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    const frame = new AnesthesiaEngine({ scenario: SCENARIO, seed: 4920, practiceRegion: 'US' }).step();
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
  function publish(model: Refeeding, tick: number) {
    const equipment = useSession.getState().equipment!;
    const vitals = Object.fromEntries(Object.entries(model.vitals())
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
    act(() => useSession.setState({ tick, state: { ...useSession.getState().state!, ...vitals },
      equipment: { ...equipment, resuscitation: { ...equipment.resuscitation, refeeding: model.snapshot(tick) } },
    }));
  }

  it('speaks seven supplied live vitals and the historical starting electrolytes without inactive equipment', () => {
    const summary = read('s');
    expect(summary).toContain('Supplied current findings were 0.30, 2.7, and 0.48 millimoles per liter');
    expect(summary).toContain('No new electrolyte and bedside reassessment has been requested');
    for (const value of ['112', '77', '22', '97', '36.7', '102', '64']) expect(summary).toContain(value);
    expect(summary).not.toMatch(/Ventilator:|fresh gas flow|tidal volume|infusions|predicted depth/);
    expect(summary).not.toMatch(/phosphate 0.50|magnesium 0.60|phosphate 0.22/);
    expect(summary).toContain('neither a universal feeding rate nor stopping all nutrition');
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });

  it('keeps early and recurrent results historical until a new request despite changed live signs', () => {
    const model = new Refeeding(); model.apply('replace-electrolytes', 0); model.apply('reassess', 0);
    model.advance(EARLY); publish(model, EARLY);
    expect(read('s')).toContain('at simulated 00:00:00: phosphate 0.30, potassium 2.7, and magnesium 0.48');
    expect(read('s')).not.toContain('phosphate 0.50');
    model.apply('reassess', EARLY); publish(model, EARLY);
    expect(read('s')).toContain('at simulated 00:30:00: phosphate 0.50, potassium 3.1, and magnesium 0.60');
    model.advance(RECURRENCE); publish(model, RECURRENCE);
    expect(read('s')).not.toContain('phosphate 0.35');
    expect(read('s')).not.toContain('requested recurrent decline');
    model.apply('reassess', RECURRENCE); publish(model, RECURRENCE);
    expect(read('s')).toContain('at simulated 01:00:00: phosphate 0.35, potassium 2.8, and magnesium 0.50');
    expect(read('s')).toContain('historical observations, not live measurements');
  });

  it('does not equate a phosphate-only observation with complete care or a nutrition plan', () => {
    const model = new Refeeding(); model.apply('phosphate-only', 0); model.advance(EARLY); publish(model, EARLY);
    expect(read('s')).not.toContain('phosphate 0.45');
    model.apply('reassess', EARLY); publish(model, EARLY);
    const summary = read('s');
    expect(summary).toContain('phosphate 0.45, potassium 2.7, and magnesium 0.48');
    expect(summary).toContain('Comprehensive electrolyte care: not yet requested');
    expect(summary).toContain('Individualized nutrition review: not yet requested');
    expect(summary).toContain('Phosphate-only care is partial care');
  });

  it('retains an observed recurrence after later improvement without inventing feeding safety', () => {
    const model = new Refeeding(); model.apply('replace-electrolytes', 0); model.apply('reassess', RECURRENCE);
    model.apply('review-nutrition', RECURRENCE); model.advance(RECURRENCE + RESPONSE); publish(model, RECURRENCE + RESPONSE);
    expect(read('s')).not.toContain('phosphate 0.55');
    model.apply('reassess', RECURRENCE + RESPONSE); publish(model, RECURRENCE + RESPONSE);
    const summary = read('s');
    expect(summary).toContain('phosphate 0.55, potassium 3.3, and magnesium 0.65');
    expect(summary).toContain('A requested recurrent decline remains in the record');
    expect(summary).toContain('do not establish normalization or lasting safety');
  });

  it('keeps capnography unavailable and does not describe a generic normal waveform', () => {
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

  it('suppresses unsupported carbon-dioxide crossings but retains saturation warnings', () => {
    const spoken = () => [...container.querySelectorAll('.visually-hidden[aria-live], .visually-hidden[role="alert"]')]
      .map((node) => node.textContent).join(' ');
    act(() => useSession.setState({ state: { ...useSession.getState().state!, etco2MmHg: 80 } }));
    expect(spoken()).not.toMatch(/end-tidal|carbon dioxide/i);
    act(() => useSession.setState({ state: { ...useSession.getState().state!, spo2Percent: 85 } }));
    expect(spoken()).toContain('Oxygen saturation fell below 90');
  });

  it('uses shared-clock seconds and dispatches dedicated choices without generic anesthesia prompts', () => {
    const tick = EARLY + 7 * TICKS_PER_SECOND;
    const model = new Refeeding(); model.apply('replace-electrolytes', 0); model.apply('reassess', tick); publish(model, tick);
    expect(read('s')).toContain('at simulated 00:30:07: phosphate 0.50');
    const thiamine = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Request qualified thiamine support')!;
    act(() => thiamine.click());
    expect(perform).toHaveBeenCalledWith({ type: 'refeeding-response', payload: { action: 'thiamine' } });
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    expect(container.textContent).not.toMatch(/propofol|Watch a 90-second/i);
  });
});
