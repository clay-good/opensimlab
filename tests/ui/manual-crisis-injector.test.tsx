/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ManualCrisisInjector, MODELED_CRISIS_INJECTIONS } from '@anesthesia/ui/ManualCrisisInjector';

describe('manual crisis-injector author tool', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label) as HTMLButtonElement | undefined;

  it('exposes exactly the modeled foundation and states the remaining gap', () => {
    act(() => root.render(createElement(ManualCrisisInjector, {
      injectedCrisisIds: [], onInject: () => {},
    })));
    expect(MODELED_CRISIS_INJECTIONS).toHaveLength(9);
    expect(container.textContent).toContain('Massive hemorrhage');
    expect(container.textContent).toContain('shockable VF');
    expect(container.textContent).toContain('non-shockable asystole');
    expect(container.textContent).toContain('High spinal and air embolism are not offered');
    expect(button('Select High spinal')).toBeUndefined();
  });

  it('requires confirmation and sends the semantic crisis id', () => {
    const onInject = vi.fn();
    act(() => root.render(createElement(ManualCrisisInjector, {
      injectedCrisisIds: [], onInject,
    })));
    act(() => button('Select Bronchospasm')!.click());
    expect(onInject).not.toHaveBeenCalled();
    act(() => button('Inject Bronchospasm')!.click());
    expect(onInject).toHaveBeenCalledWith('bronchospasm');
  });

  it('disables every previously accepted crisis, not only the most recent one', () => {
    act(() => root.render(createElement(ManualCrisisInjector, {
      injectedCrisisIds: ['bronchospasm', 'anaphylaxis'], onInject: () => {},
    })));
    expect(button('Already injected')).toBeInstanceOf(HTMLButtonElement);
    expect([...container.querySelectorAll('button')]
      .filter((entry) => entry.textContent?.trim() === 'Already injected'))
      .toHaveLength(2);
  });
});
