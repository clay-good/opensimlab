/** @vitest-environment jsdom */
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentRoute } from '@routes/DocumentRoute';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

describe('private practice history controls', () => {
  it('keeps inspection, export, import, and erase together on the privacy page', () => {
    const markup = renderToStaticMarkup(<DocumentRoute path="/privacy" />);
    expect(markup).toContain('Your private practice history');
    expect(markup).toContain('<strong>0</strong> bounded attempt summaries');
    expect(markup).toContain('Export practice history');
    expect(markup).toContain('Import practice history');
    expect(markup).toContain('Erase practice history');
    expect(markup).toContain('No reflection, action list, physiology');
  });
});
