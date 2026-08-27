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
import { HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypernatremic-dehydration-avp-deficiency';
import { AvpDeficiency, AVP_DEFICIENCY_VOLUME_TICKS as VOLUME, AVP_DEFICIENCY_DESMOPRESSIN_TICKS as DESMOPRESSIN,
  AVP_DEFICIENCY_UNCONTROLLED_TICKS as UNCONTROLLED, AVP_DEFICIENCY_RESPONSE_TICKS as RESPONSE,
} from '../../src/modules/endocrine-metabolic/avp-deficiency';
import { AVP_DEFICIENCY_FIXTURES as FIXTURES } from '../../src/modules/endocrine-metabolic/avp-deficiency-fixtures';

vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: ({ onWhy }: { onWhy: (field: StateField) => void }) => <>
  {(['etco2MmHg', 'fio2', 'heartRateBpm'] as const).map((field) =>
    <button key={field} data-why-field={field} onClick={() => onWhy(field)}>Explain {field}</button>)}
</> }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));
const initialSession = useSession.getState();

describe('Known AVP deficiency nonvisual observation boundaries', () => {
  let container: HTMLDivElement; let root: Root;
  const perform = vi.fn(); const play = vi.fn(); const pause = vi.fn();
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1)); vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    const frame = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' }).step();
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
  function publish(model: AvpDeficiency, tick: number) {
    const equipment = useSession.getState().equipment!;
    const vitals = Object.fromEntries(Object.entries(model.vitals())
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
    act(() => useSession.setState({ tick, state: { ...useSession.getState().state!, ...vitals },
      equipment: { ...equipment, resuscitation: { ...equipment.resuscitation, avpDeficiency: model.snapshot(tick) } },
    }));
  }
  it('supplies the initial sodium without inventing a requested result or inactive equipment', () => {
    const summary = read('s');
    expect(summary).toMatch(/162 millimoles per liter/);
    expect(summary).toMatch(/no .*reassessment has been requested/i);
    expect(summary).toContain('Highest observed sodium: 162');
    expect(summary).not.toMatch(/Ventilator:|fresh gas flow|tidal volume|infusions|predicted depth/);
    expect(summary).not.toMatch(/urine osmolality.*100|urine output.*450/i);
    expect(perform).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
  });
  it('keeps old sodium and urine findings historical despite new visible circulation and latent water loss', () => {
    const model = new AvpDeficiency(); model.apply('restore-volume', 0); model.apply('reassess', 0);
    model.advance(VOLUME); publish(model, VOLUME);
    const circulation = read('s');
    expect(circulation).toContain('at simulated 00:00:00: sodium 162');
    expect(circulation).not.toMatch(/sodium 163|urine output 450|osmolality 95/);
    model.advance(UNCONTROLLED); publish(model, UNCONTROLLED);
    expect(read('s')).not.toMatch(/sodium 165|urine output 450|osmolality 95/);
    model.apply('reassess', UNCONTROLLED); publish(model, UNCONTROLLED);
    const measured = read('s');
    expect(measured).toContain('at simulated 02:00:00: sodium 165');
    expect(measured).toMatch(/urine output 450/); expect(measured).toMatch(/osmolality 95/);
    expect(measured).toContain('Highest observed sodium: 165');
    expect(measured).toMatch(/historical observations, not live measurements/);
  });
  it('does not reveal the desmopressin urine response before a new assessment or call it sodium correction', () => {
    const model = new AvpDeficiency(); model.apply('restore-volume', 0); model.apply('reassess', VOLUME);
    model.apply('restore-desmopressin', VOLUME); model.advance(VOLUME + DESMOPRESSIN);
    publish(model, VOLUME + DESMOPRESSIN);
    expect(read('s')).toMatch(/urine output 450/);
    expect(read('s')).not.toMatch(/urine output 80|osmolality 500/);
    model.apply('reassess', VOLUME + DESMOPRESSIN); publish(model, VOLUME + DESMOPRESSIN);
    const summary = read('s');
    expect(summary).toContain('sodium 163'); expect(summary).toMatch(/urine output 80/);
    expect(summary).toMatch(/osmolality 500/); expect(summary).toMatch(/water.*not/i);
    expect(model.snapshot(VOLUME + DESMOPRESSIN).responseObserved).toBe(false);
  });
  it('retains a requested peak after partial combined care without announcing normalization', () => {
    const model = new AvpDeficiency(); model.apply('restore-volume', 0); model.apply('reassess', UNCONTROLLED);
    model.apply('replace-water', UNCONTROLLED); model.apply('restore-desmopressin', UNCONTROLLED);
    model.advance(UNCONTROLLED + RESPONSE); model.apply('reassess', UNCONTROLLED + RESPONSE);
    publish(model, UNCONTROLLED + RESPONSE);
    const summary = read('s');
    expect(summary).toContain('sodium 164'); expect(summary).toContain('Highest observed sodium: 165');
    expect(summary).toMatch(/not .*normalization|not .*recovery|not .*discharge/i);
    expect(summary).toMatch(/historical observations, not live measurements/);
  });
  it('describes unavailable capnography without inventing an arterial gas', () => {
    expect(read('w')).toContain('Capnography: Not supplied in this lesson');
    expect(read('w')).not.toMatch(/blood-gas|arterial carbon dioxide|alveolar plateau/);
  });
  it.each(['etco2MmHg', 'fio2'] as const)('does not expose unavailable %s in Why', (field) => {
    act(() => container.querySelector<HTMLButtonElement>(`[data-why-field="${field}"]`)!.click());
    const drawer = container.querySelector('[role="dialog"]')!;
    expect(drawer.querySelector('.numeric')!.textContent).toMatch(/^--\s/);
    expect(drawer.textContent).toMatch(/requested historical observations/);
    expect(drawer.textContent).not.toMatch(/own baseline|Ranked contributors/);
  });
  it('silences unsupported carbon-dioxide crossings while retaining saturation announcements', () => {
    const spoken = () => [...container.querySelectorAll('.visually-hidden[aria-live], .visually-hidden[role="alert"]')]
      .map((node) => node.textContent).join(' ');
    act(() => useSession.setState({ state: { ...useSession.getState().state!, etco2MmHg: 80 } }));
    expect(spoken()).not.toMatch(/end-tidal|carbon dioxide/i);
    act(() => useSession.setState({ state: { ...useSession.getState().state!, spo2Percent: 85 } }));
    expect(spoken()).toContain('Oxygen saturation fell below 90');
  });
  it('uses seconds from the shared clock when announcing a requested observation', () => {
    const tick = VOLUME + 7 * TICKS_PER_SECOND;
    const model = new AvpDeficiency(); model.apply('restore-volume', 0); model.apply('reassess', tick); publish(model, tick);
    expect(read('s')).toContain('at simulated 00:15:07: sodium 163');
  });
});
