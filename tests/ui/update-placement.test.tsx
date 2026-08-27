/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StatusBar, type StatusBarProps } from '@anesthesia/ui/StatusBar';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';

const baseCss = readFileSync(join(process.cwd(), 'src/platform/tokens/base.css'), 'utf8');
const cockpitCss = readFileSync(join(process.cwd(), 'src/modules/anesthesia/ui/cockpit.css'), 'utf8');
const description = 'An update is ready in More options.';

describe('Update availability in the existing cockpit gateway', () => {
  let container: HTMLDivElement; let root: Root; let props: StatusBarProps;
  const render = (patch: Partial<StatusBarProps> = {}) => {
    props = { ...props, ...patch };
    act(() => root.render(<StrictMode><StatusBar {...props} /></StrictMode>));
  };
  const button = (label: string) => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    props = {
      scenario: ROUTINE_INDUCTION, elapsed: '00:12', transport: 'running', speed: 1,
      onPlay: vi.fn(), onPause: vi.fn(), onStep: vi.fn(), onReset: vi.fn(), onSpeed: vi.fn(), onOverflow: vi.fn(),
    };
    render();
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it('preserves the More options button, focus, and controls when availability changes', () => {
    const more = button('More options'); const count = container.querySelectorAll('button').length;
    expect(more.getAttribute('aria-describedby')).toBeNull();
    expect(container.querySelector('.status-bar__update-indicator')).toBeNull();
    more.focus(); render({ updateAvailable: true });
    expect(button('More options')).toBe(more); expect(document.activeElement).toBe(more);
    expect(more.disabled).toBe(false); expect(more.classList.contains('status-bar__more')).toBe(true);
    expect(container.querySelectorAll('button')).toHaveLength(count);
    const detail = document.getElementById(more.getAttribute('aria-describedby')!);
    expect(detail?.textContent).toBe(description); expect(detail?.classList.contains('visually-hidden')).toBe(true);
    expect(detail?.hasAttribute('aria-live')).toBe(false);
    const indicator = more.querySelector('.status-bar__update-indicator');
    expect(indicator?.getAttribute('aria-hidden')).toBe('true');
    for (const callback of [props.onPlay, props.onPause, props.onStep, props.onReset, props.onSpeed, props.onOverflow]) {
      expect(callback).not.toHaveBeenCalled();
    }
    act(() => more.click()); expect(props.onOverflow).toHaveBeenCalledOnce();
    render({ updateAvailable: false });
    expect(button('More options')).toBe(more); expect(document.activeElement).toBe(more);
    expect(more.getAttribute('aria-describedby')).toBeNull();
    expect(more.querySelector('.status-bar__update-indicator')).toBeNull();
  });

  it('keeps each transport action independent of the update indicator', () => {
    render({ updateAvailable: true });
    act(() => button('Pause').click()); expect(props.onPause).toHaveBeenCalledOnce();
    act(() => button('Advance one simulated second').click()); expect(props.onStep).toHaveBeenCalledOnce();
    act(() => button('Reset the scenario').click()); expect(props.onReset).toHaveBeenCalledOnce();
    render({ transport: 'paused' });
    act(() => button('Play').click()); expect(props.onPlay).toHaveBeenCalledOnce();
    expect(props.onOverflow).not.toHaveBeenCalled(); expect(props.onSpeed).not.toHaveBeenCalled();
  });

  it('gives independently mounted status bars distinct accessible description IDs', () => {
    act(() => root.render(<StrictMode><StatusBar {...props} updateAvailable /><StatusBar {...props} updateAvailable /></StrictMode>));
    const buttons = [...container.querySelectorAll('button[aria-label="More options"]')];
    const ids = buttons.map((item) => item.getAttribute('aria-describedby'));
    expect(ids).toHaveLength(2); expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(document.getElementById(id!)?.textContent).toBe(description);
  });

  it('keeps the indicator out of flow without expanding the gateway box', () => {
    const more = cockpitCss.match(/\.status-bar__more\s*\{([^}]+)\}/)?.[1];
    const indicator = cockpitCss.match(/\.status-bar__update-indicator\s*\{([^}]+)\}/)?.[1];
    expect(more).toContain('position: relative');
    expect(more).not.toMatch(/(?:width|height|size|padding|margin)\s*:/);
    expect(indicator).toContain('position: absolute');
    expect(indicator).toContain('pointer-events: none');
  });

  it('prevents the fixed-height status speed group from shrinking or wrapping without changing modal groups', () => {
    const componentsCss = readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8');
    const general = componentsCss.match(/\.segmented\s*\{[^}]+\}/)?.[0];
    const status = cockpitCss.match(/\.status-bar\s*>\s*\.segmented\s*\{[^}]+\}/)?.[0];
    expect(general).toContain('flex-wrap: wrap');
    expect(status).toContain('flex: 0 0 auto'); expect(status).toContain('flex-wrap: nowrap');
    expect(cockpitCss).toContain('.status-bar .segmented { display: none; }');
    const style = document.createElement('style'); style.textContent = `${general}\n${status}`;
    const modal = document.createElement('div'); modal.setAttribute('aria-modal', 'true');
    const menuSpeed = document.createElement('div'); menuSpeed.className = 'segmented'; modal.append(menuSpeed);
    document.head.append(style); container.append(modal);
    try {
      const statusSpeed = container.querySelector<HTMLElement>('.status-bar > .segmented')!;
      expect(statusSpeed.getAttribute('aria-label')).toBe('Simulation speed');
      expect(getComputedStyle(statusSpeed).flexShrink).toBe('0');
      expect(getComputedStyle(statusSpeed).flexGrow).toBe('0');
      expect(getComputedStyle(statusSpeed).flexWrap).toBe('nowrap');
      expect(getComputedStyle(menuSpeed).flexWrap).toBe('wrap');
      expect(menuSpeed.matches('.status-bar > .segmented')).toBe(false);
    } finally { style.remove(); modal.remove(); }
  });

  it('removes narrow cockpit gaps with enough specificity for landscape while retaining 44 px controls', () => {
    const narrow = cockpitCss.match(/@media\s*\(max-width:\s*400px\)\s*\{([\s\S]*?)\n\}/)?.[1];
    expect(narrow).toContain('.cockpit .status-bar { gap: 0; }');
    expect(narrow).toContain('.cockpit .status-bar__more { margin-inline-start: var(--space-2); }');
    const tokensCss = readFileSync(join(process.cwd(), 'src/platform/tokens/tokens.generated.css'), 'utf8');
    expect(tokensCss).toMatch(/--space-2:\s*8px;/);
    expect(narrow).toContain('.status-bar__step { display: none; }');
    expect(narrow).not.toMatch(/(?:inline-size|block-size|width|height|transform|scale)\s*:/);
    const landscape = cockpitCss.match(/@media\s*\(max-height:\s*499px\) and \(orientation: landscape\)\s*\{([\s\S]*?)\n\}/)?.[1];
    // Two class selectors in the narrow rule beat the later one-class rule.
    expect(landscape).toContain('.status-bar { gap: var(--space-3); }');
    const componentsCss = readFileSync(join(process.cwd(), 'src/platform/ui/components.css'), 'utf8');
    const icon = componentsCss.match(/\.icon-button\s*\{[^}]+\}/)?.[0];
    expect(icon).toContain('inline-size: 44px'); expect(icon).toContain('block-size: 44px');
    expect(icon).toContain('flex: 0 0 auto');
    const style = document.createElement('style'); style.textContent = icon!; document.head.append(style);
    try {
      for (const label of ['More options', 'Pause']) {
        const control = getComputedStyle(button(label));
        expect(control.inlineSize).toBe('44px'); expect(control.blockSize).toBe('44px');
        expect(control.flexShrink).toBe('0');
      }
    } finally { style.remove(); }
  });
});

describe('Page and session update placement', () => {
  it('keeps the page notice in normal flow instead of covering controls', () => {
    const rules = [...baseCss.matchAll(/(?:^|\n)\.update-notice(?:--page)?\s*\{([^}]+)\}/g)].map((match) => match[1]).join('\n');
    expect(rules).toContain('display: flex');
    expect(rules).not.toMatch(/position:\s*(?:fixed|absolute|sticky)|(?:inset[\w-]*|z-index)\s*:/);
  });

  it('hides only the page offer in a cockpit and keeps the More options offer visible', () => {
    // JSDOM proves selector behavior; real-browser checks own pixel geometry.
    const cockpitRule = baseCss.match(/body:has\(\.cockpit\)\s+\.update-notice--page\s*\{[^}]+\}/)?.[0];
    const modalRule = baseCss.match(/body:has\(\[aria-modal='true'\]\)\s+\.update-notice--page\s*\{[^}]+\}/)?.[0];
    expect(cockpitRule).toContain('display: none'); expect(modalRule).toContain('visibility: hidden');
    const style = document.createElement('style'); style.textContent = `${cockpitRule}\n${modalRule}`;
    const page = document.createElement('div'); page.className = 'update-notice update-notice--page';
    const cockpit = document.createElement('div'); cockpit.className = 'cockpit';
    const menu = document.createElement('div'); menu.setAttribute('aria-modal', 'true');
    const session = document.createElement('div'); session.className = 'update-notice update-notice--session';
    menu.append(session); document.head.append(style); document.body.append(page);
    try {
      expect(getComputedStyle(page).display).not.toBe('none');
      document.body.append(cockpit);
      expect(getComputedStyle(page).display).toBe('none');
      cockpit.append(menu);
      expect(getComputedStyle(session).display).not.toBe('none');
      expect(getComputedStyle(session).visibility).toBe('visible');
      menu.remove(); expect(getComputedStyle(page).display).toBe('none');
      cockpit.remove(); expect(getComputedStyle(page).display).not.toBe('none');
      expect(getComputedStyle(page).visibility).toBe('visible');
    } finally { style.remove(); page.remove(); cockpit.remove(); menu.remove(); }
  });
});
