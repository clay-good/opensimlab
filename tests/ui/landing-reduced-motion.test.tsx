/** @vitest-environment jsdom */
/**
 * The landing hero must never start its animation for a visitor who prefers
 * reduced motion, not even for the one render before the preference hook has
 * caught up with the browser.
 */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as HeroModule from '../../src/landing/hero';

const hero = vi.hoisted(() => ({ start: vi.fn(() => () => {}) }));
vi.mock('../../src/landing/hero', async (importOriginal) => ({
  ...(await importOriginal<typeof HeroModule>()),
  startLiveHero: hero.start,
}));

import { Landing } from '../../src/landing/Landing';

function prefer(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion: reduce'),
    media: query, addEventListener: () => {}, removeEventListener: () => {},
  }));
}

async function mount() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => { root.render(createElement(Landing)); });
  return () => act(() => root.unmount());
}

afterEach(() => { vi.unstubAllGlobals(); hero.start.mockClear(); document.body.innerHTML = ''; });

describe('Requirement: the landing hero respects reduced motion from the first frame', () => {
  it('starts the live hero when no preference is set', async () => {
    prefer(false);
    const unmount = await mount();
    expect(hero.start).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it('never starts it when reduced motion is preferred', async () => {
    prefer(true);
    const unmount = await mount();
    expect(hero.start).not.toHaveBeenCalled();
    await unmount();
  });
});
