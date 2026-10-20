import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NOT_FOUND_DESTINATIONS, notFoundHtml, notFoundLink, notFoundWhy } from '@routes/not-found';
import { routeFor } from '@routes/routes';

describe('the not-found page', () => {
  it('lists every destination, each a real route, in the static document', () => {
    const html = notFoundHtml();
    expect(html).toContain('<h1>Nothing here</h1>');
    for (const { href, key } of NOT_FOUND_DESTINATIONS) {
      expect(routeFor(href), href).toBeDefined();
      expect(html).toContain(`<li><a href="${href}">${notFoundLink(key)}</a> — ${notFoundWhy(key)}</li>`);
    }
  });

  it('is rendered by the client from the same list, so the two cannot drift', () => {
    const app = readFileSync('src/routes/App.tsx', 'utf8');
    expect(app).toContain('NOT_FOUND_DESTINATIONS.map');
    expect(app).not.toContain('<li><a href="/privacy">Privacy</a>');
    expect(readFileSync('scripts/prerender.ts', 'utf8')).toContain('notFoundHtml()');
  });
});
