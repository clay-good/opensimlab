/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { updateDocumentMetadata } from '@routes/App';
import { routeFor } from '@routes/routes';

describe('Requirement: client navigation keeps route metadata coherent', () => {
  it('updates canonical, alternate, Open Graph, and Twitter metadata together', () => {
    document.head.innerHTML = '<meta name="description" content="old"><link rel="canonical" href="https://opensimlab.com/">';
    const route = routeFor('/anesthesia/scenario/dilutional-coagulopathy')!;
    updateDocumentMetadata(route);

    const canonical = 'https://opensimlab.com/anesthesia/scenario/dilutional-coagulopathy';
    const image = 'https://opensimlab.com/og/anesthesia-scenario-dilutional-coagulopathy.svg';
    expect(document.title).toBe(route.title);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content'))
      .toBe(route.description);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(canonical);
    expect(document.querySelector('link[hreflang="en"]')?.getAttribute('href')).toBe(canonical);
    expect(document.querySelector('link[hreflang="x-default"]')?.getAttribute('href')).toBe(canonical);
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(canonical);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(image);
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(image);
  });
});
