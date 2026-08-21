/**
 * @vitest-environment jsdom
 *
 * No surface is a dead end.
 *
 * The scenario index and the scenario briefing had no navigation at all —
 * between them, five links, every one of them deeper into a scenario. Somebody
 * who followed a shared link to a briefing could start the scenario or close the
 * tab. They could not reach the scenario list, the validation report, the
 * governance page, or the front door. That is a bad first experience for exactly
 * the person this project needs: a sceptical educator arriving from a link.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { SITE_BAR_LINKS, SiteBar } from '@platform/ui';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNITED_STATES } from '@anesthesia/region/profiles';

const hrefs = (markup: string) =>
  [...markup.matchAll(/href="([^"]+)"/g)].map((match) => match[1]!);

describe('the site bar', () => {
  const markup = renderToStaticMarkup(createElement(SiteBar, {}));

  it('always gets you home', () => {
    expect(hrefs(markup)).toContain('/');
  });

  it('offers the scenario list and the two pages a sceptic wants', () => {
    const links = hrefs(markup);
    expect(links).toContain('/anesthesia');
    expect(links).toContain('/validation');
    expect(links).toContain('/governance');
    expect(links).toContain('/about');
  });

  it('marks the page you are on rather than offering it', () => {
    const here = renderToStaticMarkup(createElement(SiteBar, { current: '/validation' }));
    expect(here).toContain('aria-current="page"');
    expect((here.match(/aria-current="page"/g) ?? [])).toHaveLength(1);
  });

  it('is a labelled landmark, so it can be skipped', () => {
    expect(markup).toContain('aria-label="Site"');
  });

  it('appends a surface\'s own destinations after the shared ones', () => {
    const withExtras = renderToStaticMarkup(createElement(SiteBar, {
      extra: [{ href: '/limitations', label: 'Limitations' }],
    }));
    const links = hrefs(withExtras);
    expect(links).toContain('/limitations');
    // Shared first, specific after.
    expect(links.indexOf('/limitations')).toBeGreaterThan(links.indexOf('/validation'));
  });

  it('every destination it offers is a path, not a guess', () => {
    for (const link of SITE_BAR_LINKS) {
      expect(link.href.startsWith('/'), link.href).toBe(true);
      expect(link.label.length).toBeGreaterThan(2);
    }
  });
});

describe('the scenario briefing', () => {
  const markup = renderToStaticMarkup(createElement(Prebrief, {
    scenario: ROUTINE_INDUCTION,
    region: UNITED_STATES,
    onStart: () => {},
    guidance: 'coached' as const,
    onGuidance: () => {},
  }));

  it('is no longer a page you can only go forward from', () => {
    const links = hrefs(markup);
    expect(links.length).toBeGreaterThan(0);
    expect(links).toContain('/');
    expect(links).toContain('/anesthesia');
  });

  it('still leads with starting the scenario', () => {
    // Navigation was added without demoting the thing the page is for.
    expect(markup).toContain('Start the scenario');
    expect(markup.indexOf('Start the scenario')).toBeGreaterThan(markup.indexOf('href="/"'));
  });
});
