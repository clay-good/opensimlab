/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Drawer, Modal } from '@platform/ui';

describe('Shared dialogs own only their topmost interaction layer', () => {
  let root: Root; let host: HTMLDivElement; let launcher: HTMLButtonElement;
  let state: { drawer: boolean; modal: boolean; dismissible: boolean; empty: boolean; mountDrawer: boolean };
  const drawerClosed = vi.fn(); const modalClosed = vi.fn();

  function render(patch: Partial<typeof state> = {}) {
    state = { ...state, ...patch };
    act(() => root.render(<StrictMode>
      {state.mountDrawer && <Drawer key="source" open={state.drawer} title="Source" onClose={() => {
        drawerClosed(); render({ drawer: false });
      }}>
        <button id="source-report">Report this source</button>
        <button id="source-last">Source final control</button>
      </Drawer>}
      <Modal key="report" open={state.modal} title="Help us improve this" dismissible={state.dismissible} onClose={() => {
        modalClosed(); render({ modal: false });
      }}>
        {!state.empty && <><button id="report-first">First report control</button><button id="report-last">Last report control</button></>}
      </Modal>
    </StrictMode>));
  }

  function element(selector: string) { return host.querySelector<HTMLElement>(selector)!; }
  function key(key: string, shiftKey = false, handled = false) {
    const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
    if (handled) event.preventDefault();
    act(() => document.activeElement!.dispatchEvent(event));
    return event;
  }
  function openPair() {
    render({ drawer: true }); element('#source-report').focus(); render({ modal: true });
  }

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div'); launcher = document.createElement('button'); launcher.textContent = 'Open source';
    document.body.append(launcher, host); launcher.focus(); root = createRoot(host);
    state = { drawer: false, modal: false, dismissible: true, empty: false, mountDrawer: true };
    render();
  });
  afterEach(() => { act(() => root.unmount()); host.remove(); launcher.remove(); vi.clearAllMocks(); });

  it('preserves initial focus, Tab wrapping, Escape, and restoration for one modal', () => {
    render({ modal: true }); expect(document.activeElement).toBe(element('#report-first'));
    expect(key('Tab', true).defaultPrevented).toBe(true); expect(document.activeElement).toBe(element('#report-last'));
    expect(key('Tab').defaultPrevented).toBe(true); expect(document.activeElement).toBe(element('#report-first'));
    key('Escape'); expect(modalClosed).toHaveBeenCalledOnce(); expect(document.activeElement).toBe(launcher);
  });

  it('keeps Escape and focus restoration with the top modal, then the source drawer', () => {
    openPair(); expect(document.activeElement).toBe(element('#report-first'));
    key('Escape');
    expect(modalClosed).toHaveBeenCalledOnce(); expect(drawerClosed).not.toHaveBeenCalled();
    expect(element('.drawer')).not.toBeNull(); expect(document.activeElement).toBe(element('#source-report'));
    key('Escape'); expect(drawerClosed).toHaveBeenCalledOnce(); expect(document.activeElement).toBe(launcher);
  });

  it('lets only the top layer wrap Tab in either direction', () => {
    openPair();
    key('Tab', true); expect(document.activeElement).toBe(element('#report-last'));
    key('Tab'); expect(document.activeElement).toBe(element('#report-first'));
    element('#source-last').focus();
    expect(document.activeElement).toBe(element('#report-first'));
    key('Tab', true); expect(document.activeElement).toBe(element('#report-last'));
  });

  it('blocks lower Escape while the top modal is nondismissible, including after a rerender', () => {
    openPair(); render({ dismissible: false });
    expect(key('Escape').defaultPrevented).toBe(true);
    expect(modalClosed).not.toHaveBeenCalled(); expect(drawerClosed).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(element('#report-first'));
    render({ dismissible: true }); key('Escape');
    expect(modalClosed).toHaveBeenCalledOnce(); expect(drawerClosed).not.toHaveBeenCalled();
  });

  it('honors keys already handled by a child without dismissing or moving focus', () => {
    openPair(); const first = element('#report-first');
    key('Tab', true, true); expect(document.activeElement).toBe(first);
    key('Escape', false, true); expect(modalClosed).not.toHaveBeenCalled(); expect(drawerClosed).not.toHaveBeenCalled();
  });

  it('focuses an empty top modal and prevents Tab from escaping it', () => {
    openPair(); render({ empty: true });
    const modal = element('.modal');
    key('Tab'); expect(document.activeElement).toBe(modal);
    expect(key('Tab', true).defaultPrevented).toBe(true); expect(document.activeElement).toBe(modal);
    key('Escape'); expect(document.activeElement).toBe(element('#source-report'));
  });

  it('recovers Tab focus when the previously focused control is removed', () => {
    openPair(); element('#report-first').remove();
    expect(document.activeElement).toBe(document.body);
    expect(key('Tab').defaultPrevented).toBe(true); expect(document.activeElement).toBe(element('#report-last'));
  });

  it('does not steal focus when a lower layer unmounts and restores through its invoker chain', () => {
    openPair(); const report = element('#report-first');
    render({ mountDrawer: false }); expect(document.activeElement).toBe(report);
    key('Escape'); expect(modalClosed).toHaveBeenCalledOnce(); expect(drawerClosed).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(launcher);
  });

  it('restores outside focus when both layers close together, despite cleanup ordering', () => {
    openPair(); render({ drawer: false, modal: false });
    expect(document.activeElement).toBe(launcher);
  });

  it('does not retain stale ownership across Strict Mode opening, closing, and reopening', () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      openPair(); key('Escape'); expect(document.activeElement).toBe(element('#source-report'));
      key('Escape'); expect(document.activeElement).toBe(launcher);
    }
    expect(modalClosed).toHaveBeenCalledTimes(3); expect(drawerClosed).toHaveBeenCalledTimes(3);
  });

  it('keeps an already open modal above a drawer that opens afterward', () => {
    render({ modal: true }); const report = element('#report-first');
    render({ drawer: true }); expect(document.activeElement).toBe(report);
    key('Escape'); expect(modalClosed).toHaveBeenCalledOnce(); expect(drawerClosed).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(launcher);
    key('Escape'); expect(document.activeElement).toBe(launcher);
  });

  it.each(['drawer', 'modal'])('gives an initially open child modal ownership over its parent %s in Strict Mode', (parent) => {
    const parentClose = vi.fn(); const childClose = vi.fn();
    const child = <Modal open title="Child modal" onClose={childClose}>
      <button id="child-first">Child first</button><button id="child-last">Child last</button>
    </Modal>;
    act(() => root.render(<StrictMode>{parent === 'drawer'
      ? <Drawer open title="Parent drawer" onClose={parentClose}><button>Parent control</button>{child}</Drawer>
      : <Modal open title="Parent modal" onClose={parentClose}><button>Parent control</button>{child}</Modal>
    }</StrictMode>));
    expect(document.activeElement).toBe(element('#child-first'));
    key('Tab', true); expect(document.activeElement).toBe(element('#child-last'));
    key('Tab'); expect(document.activeElement).toBe(element('#child-first'));
    key('Escape'); expect(childClose).toHaveBeenCalledOnce(); expect(parentClose).not.toHaveBeenCalled();
    act(() => root.render(<StrictMode />));
    expect(document.activeElement).toBe(launcher);
  });

  it('focuses the container when a modal opens without focusable controls', () => {
    render({ modal: true, empty: true }); expect(document.activeElement).toBe(element('.modal'));
    key('Tab'); expect(document.activeElement).toBe(element('.modal'));
    key('Escape'); expect(document.activeElement).toBe(launcher);
  });

  it('preserves background interaction and restores an external invoker beside a nonmodal drawer', () => {
    render({ drawer: true }); launcher.focus();
    expect(document.activeElement).toBe(launcher);
    expect(key('Tab').defaultPrevented).toBe(false);
    render({ modal: true }); expect(document.activeElement).toBe(element('#report-first'));
    launcher.focus(); expect(document.activeElement).toBe(element('#report-first'));
    key('Escape'); expect(document.activeElement).toBe(launcher); expect(element('.drawer')).not.toBeNull();
    key('Escape'); expect(drawerClosed).toHaveBeenCalledOnce();
  });

  it.each(['summary', 'iframe'])('includes native %s in the top modal focus cycle', (control) => {
    act(() => root.render(<StrictMode><Modal open title="Native control" onClose={() => {}}>
      {control === 'summary' ? <details><summary>Review report payload</summary><p>Anonymous payload</p></details>
        : <iframe title="Security check" />}
    </Modal></StrictMode>));
    const item = element(control); expect(document.activeElement).toBe(item);
    expect(key('Tab').defaultPrevented).toBe(true); expect(document.activeElement).toBe(item);
    expect(key('Tab', true).defaultPrevented).toBe(true); expect(document.activeElement).toBe(item);
  });
});
