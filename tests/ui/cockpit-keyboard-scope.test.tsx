/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cockpit } from '@anesthesia/ui/Cockpit';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SonificationEngine } from '@platform/audio/sonification';
import { useSession } from '@platform/session/session-store';
import { UpdateProvider } from '@platform/offline/UpdateNotice';
import { UPDATE_READY_EVENT, UPDATE_FAILED_EVENT } from '@platform/offline/register';

// Keep the real cockpit, controls, dialogs, store subscription, and keyboard
// effect. Only the two canvas-rendering regions are irrelevant to these tests.
vi.mock('@anesthesia/ui/MonitorRegion', () => ({ MonitorRegion: () => null }));
vi.mock('@anesthesia/ui/AnalysisRegion', () => ({ AnalysisRegion: () => null }));

const initialSession = useSession.getState();
const keys = [' ', '.', 's', 'S', 'w', 'W', 'a', 'A', 'v', 'V', 'l', 'L', 'c', 'C', 'e', 'E', 'd', 'D', '?'];

describe('Cockpit shortcuts respect the focused interaction', () => {
  let container: HTMLDivElement; let root: Root;
  const play = vi.fn(); const pause = vi.fn(); const singleStep = vi.fn(); const perform = vi.fn();
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    const frame = new AnesthesiaEngine({ scenario: ROUTINE_INDUCTION, seed: 1, practiceRegion: 'US' }).step();
    useSession.setState({ ...initialSession, phase: 'running', transport: 'paused', guidance: 'unassisted',
      state: frame.state, equipment: frame.equipment, play, pause, singleStep, act: perform,
      alarms: [{ alarmId: 'test-alarm', priority: 'high', parameter: 'meanArterialMmHg', value: 40,
        unit: 'mmHg', message: 'Test alarm', sinceTick: 0, silencedUntilTick: null }],
    });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    act(() => root.render(<UpdateProvider><Cockpit scenario={ROUTINE_INDUCTION} region={UNITED_STATES}
      audio={new SonificationEngine()} onEnd={() => {}} /></UpdateProvider>));
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove();
    useSession.setState(initialSession, true);
    vi.unstubAllGlobals(); vi.clearAllMocks();
  });

  function press(target: Element, key: string, handled = false) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    if (handled) event.preventDefault();
    act(() => target.dispatchEvent(event));
    return event;
  }

  function expectNoShortcuts(target: Element, handled = false) {
    const before = container.textContent;
    for (const key of keys) expect(press(target, key, handled).defaultPrevented, key).toBe(handled);
    expect(play).not.toHaveBeenCalled(); expect(pause).not.toHaveBeenCalled();
    expect(singleStep).not.toHaveBeenCalled(); expect(perform).not.toHaveBeenCalled();
    expect(container.textContent).toBe(before);
  }

  it.each(['button', 'a', 'input', 'textarea', 'select', 'summary'])('leaves native %s keys alone', (tag) => {
    const control = document.createElement(tag);
    if (tag === 'a') control.setAttribute('href', '#source');
    container.append(control);
    expectNoShortcuts(control);
  });

  it.each(['button', 'link', 'textbox', 'combobox', 'spinbutton'])('respects custom %s controls and nested targets', (role) => {
    const control = document.createElement('div'); control.setAttribute('role', role);
    const child = document.createElement('span'); control.append(child); container.append(control);
    expectNoShortcuts(child);
  });

  it.each(['dialog', 'alertdialog'])('does not run any shortcut inside an ARIA %s', (role) => {
    const dialog = document.createElement('section'); dialog.setAttribute('role', role);
    const child = document.createElement('span'); dialog.append(child); container.append(dialog);
    expectNoShortcuts(child);
  });

  it('does not run shortcuts inside a native dialog', () => {
    const dialog = document.createElement('dialog'); dialog.open = true;
    const child = document.createElement('span'); dialog.append(child); container.append(dialog);
    expectNoShortcuts(child);
  });

  it.each(['', 'true', 'plaintext-only'])('leaves inherited contenteditable=%s text editing alone', (value) => {
    const editor = document.createElement('div'); editor.setAttribute('contenteditable', value);
    const child = document.createElement('span'); editor.append(child); container.append(editor);
    expectNoShortcuts(child);
  });

  it('honors events already handled on a neutral monitor surface', () => {
    expectNoShortcuts(container.querySelector('#monitor-region')!, true);
  });

  it('leaves the real scrollable worked-example narration to native keyboard reading', () => {
    const host = document.createElement('div'); container.append(host); const bar = createRoot(host);
    try {
      act(() => bar.render(<DemonstrationBar beat={{ atSecond: 0, narration: 'Read this decision.', focus: 'actions' }}
        progress={0.1} awaitingAdvance onAdvance={() => {}} onTakeControls={() => {}} />));
      const narration = host.querySelector<HTMLElement>('.demo-bar__narration')!;
      narration.focus(); expect(document.activeElement).toBe(narration);
      expectNoShortcuts(narration);
      expectNoShortcuts(narration.querySelector('p')!);
    } finally { act(() => bar.unmount()); host.remove(); }
  });

  it('does not run shortcuts while reading the real More options dialog', () => {
    act(() => container.querySelector<HTMLButtonElement>('[aria-label="More options"]')!.click());
    expectNoShortcuts(container.querySelector('[role="dialog"] h2')!);
  });

  it.each(['running', 'paused'] as const)('offers updates without changing the %s session or taking focus', async (transport) => {
    act(() => useSession.setState({ transport, tick: 420, elapsed: '00:00:42' }));
    const more = container.querySelector<HTMLButtonElement>('[aria-label="More options"]')!;
    more.focus();
    const before = useSession.getState();
    act(() => window.dispatchEvent(new Event(UPDATE_READY_EVENT)));
    expect(document.activeElement).toBe(more);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(more.getAttribute('aria-describedby')).toBeTruthy();
    expect(useSession.getState()).toBe(before);
    expect(play).not.toHaveBeenCalled(); expect(pause).not.toHaveBeenCalled();
    expect(singleStep).not.toHaveBeenCalled(); expect(perform).not.toHaveBeenCalled();

    await act(async () => more.click());
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Reloading ends this session and clears its unsaved progress.');
    const reload = [...dialog.querySelectorAll('button')].find((button) => button.textContent === 'Reload to update')!;
    // Opening routine settings must not make the session-ending action the
    // default Enter/Space target just because an update became available.
    expect(document.activeElement).not.toBe(reload);
    expect(dialog.querySelector('button')).toBe(document.activeElement);
    reload.focus();
    act(() => window.dispatchEvent(new Event(UPDATE_FAILED_EVENT)));
    expect(document.activeElement).toBe(reload);
    expect(dialog.textContent).toContain('Update could not be prepared. Your session is unchanged.');
    expectNoShortcuts(dialog.querySelector('h2')!);
    await act(async () => { press(reload, 'Escape'); });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(more);
    expect(useSession.getState()).toBe(before);
    await act(async () => more.click());
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain('Update could not be prepared.');
  });

  it('preserves transport, action, announcement, and help shortcuts on neutral cockpit surfaces', () => {
    const monitor = container.querySelector('#monitor-region')!;
    expect(press(monitor, ' ').defaultPrevented).toBe(true); expect(play).toHaveBeenCalledOnce();
    act(() => useSession.setState({ transport: 'running' }));
    press(monitor, ' '); expect(pause).toHaveBeenCalledOnce();
    press(monitor, '.'); expect(singleStep).toHaveBeenCalledOnce();
    for (const key of ['a', 'v', 'l', 'c', 'e', 'd']) press(monitor, key);
    expect(perform.mock.calls.map(([action]) => action.type)).toEqual([
      'silence-alarm', 'ventilator', 'laryngoscopy', 'chest-compressions', 'cardiac-arrest-epinephrine', 'defibrillation',
    ]);
    const before = container.textContent;
    press(monitor, 's'); expect(container.textContent).not.toBe(before);
    const summary = container.textContent;
    press(monitor, 'w'); expect(container.textContent).not.toBe(summary);
    press(monitor, '?'); expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
