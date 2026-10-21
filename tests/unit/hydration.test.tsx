/** @vitest-environment jsdom */
/**
 * platform/delivery → a prerendered route hydrates rather than re-rendering.
 *
 * The prerender wrote each route's markup bare while the client's router put
 * every lazily loaded route inside `<Suspense>`. Every hydrated route except the
 * front door failed hydration (React error #418 on the live site), and React
 * threw the server markup away and rendered it again: wasted work, and a flash
 * on the pages most likely to be read with scripting slow or blocked. Each
 * hydratable route is hydrated here against exactly the markup the prerender
 * writes, and any recoverable error fails it.
 */
import { act, createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { HYDRATABLE } from '@routes/hydratable';
import { prerenderTree } from '@routes/Prerendered';
import { App } from '@routes/App';

describe('every hydratable route hydrates its own prerendered markup', () => {
  it.each([...HYDRATABLE].map((path) => path || '/'))('%s', async (path) => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    window.history.replaceState({}, '', path);
    const container = document.createElement('div');
    container.innerHTML = renderToString(prerenderTree(path));
    document.body.replaceChildren(container);
    const recoverable: string[] = [];
    const logged: string[] = [];
    const error = vi.spyOn(console, 'error').mockImplementation((...args) => {
      logged.push(args.map(String).join(' '));
    });
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, createElement(App), {
        onRecoverableError: (failure) => recoverable.push(String((failure as Error).message).slice(0, 300)),
      });
      // Long enough for the route's lazy chunk to resolve and hydrate.
      await new Promise((resolve) => setTimeout(resolve, 1500));
    });
    error.mockRestore();
    act(() => root?.unmount());
    expect(recoverable).toEqual([]);
    expect(logged.filter((line) => /hydrat/i.test(line))).toEqual([]);
  }, 60_000);
});
