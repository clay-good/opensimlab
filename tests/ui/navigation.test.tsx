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
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { SITE_BAR_LINKS, SiteBar } from '@platform/ui';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { About } from '@landing/About';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { UNITED_STATES } from '@anesthesia/region/profiles';

const hrefs = (markup: string) =>
  [...markup.matchAll(/href="([^"]+)"/g)].map((match) => match[1]!);

describe('the site bar', () => {
  const markup = renderToStaticMarkup(createElement(SiteBar, {}));

  it('always gets you home', () => {
    expect(hrefs(markup)).toContain('/');
  });

  it('puts a working main-content skip link first', () => {
    expect(hrefs(markup)[0]).toBe('#main');
    expect(markup).toContain('class="skip-link"');
    expect(markup).toContain('Skip to main content');
  });

  it('offers the scenario list and the two pages a sceptic wants', () => {
    const links = hrefs(markup);
    expect(links).toContain('/anesthesia');
    expect(links).toContain('/validation');
    expect(links).toContain('/governance');
    expect(links).toContain('/about');
    expect(links).toContain('/limitations');
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
      extra: [{ href: '/privacy', label: 'Privacy' }],
    }));
    const links = hrefs(withExtras);
    expect(links).toContain('/privacy');
    // Shared first, specific after.
    expect(links.indexOf('/privacy')).toBeGreaterThan(links.indexOf('/validation'));
  });

  it('does not repeat a shared destination supplied as an extra', () => {
    const withDuplicate = renderToStaticMarkup(createElement(SiteBar, {
      extra: [{ href: '/limitations', label: 'Limitations' }],
    }));
    expect(hrefs(withDuplicate).filter((href) => href === '/limitations')).toHaveLength(1);
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

describe('there is one bar, not five', () => {
  /**
   * Before this, the educator pages carried three separate hand-written copies
   * of the same bar, the reviewer page a fourth, the trust documents a fifth
   * and the not-found page a sixth. Six things to keep in step, and they had
   * already drifted: not one of the educator copies offered the validation
   * report or the governance page, which are the two pages an educator
   * evaluating this most wants to see.
   */
  const routeFiles = readdirSync(join(process.cwd(), 'src/routes'))
    .filter((name) => name.endsWith('.tsx'));

  it('no surface builds its own', () => {
    const offenders: string[] = [];
    for (const name of routeFiles) {
      const source = readFileSync(join(process.cwd(), 'src/routes', name), 'utf8');
      if (source.includes('className="document__bar"')) offenders.push(name);
    }
    expect(offenders, 'these build their own bar instead of using SiteBar').toEqual([]);
  });

  it('every surface that renders a bar renders THE bar', () => {
    // Both directions: catching a hand-written bar is only half of it if a
    // surface can simply have no bar at all.
    const withoutBar: string[] = [];
    for (const name of routeFiles) {
      const source = readFileSync(join(process.cwd(), 'src/routes', name), 'utf8');
      // Two exceptions, each for a reason rather than by oversight.
      //
      // Prerendered builds the static HTML shell and renders whichever route it
      // is given, so it carries no bar of its own. FrameBudget is a measurement
      // instrument: it renders traces and times the frames, and a sticky header
      // would sit inside the thing being measured.
      if (name === 'Prerendered.tsx' || name === 'FrameBudgetRoute.tsx') continue;
      if (!source.includes('<SiteBar')) withoutBar.push(name);
    }
    expect(withoutBar).toEqual([]);
  });

  it('the About page is not a dead end either, though it earns a breadcrumb instead', () => {
    // About lives outside src/routes and is a long reading page rather than an
    // application surface, so it carries a breadcrumb and a full link list
    // rather than the bar. What matters is the same: you can always get out.
    // Asserted against the rendered page, not the source: the trust links come
    // from a shared list at runtime, so a source check would pass or fail on
    // where the array happens to live.
    const links = hrefs(renderToStaticMarkup(createElement(About)));
    expect(links).toContain('/');
    expect(links).toContain('/anesthesia');
    expect(links).toContain('/validation');
    expect(links).toContain('/governance');
  });

  it('the shared bar offers what the hand-written educator bars did not', () => {
    const markup = renderToStaticMarkup(createElement(SiteBar, {}));
    for (const destination of ['/validation', '/governance']) {
      expect(hrefs(markup), `${destination} was missing from every educator bar`)
        .toContain(destination);
    }
  });
});
