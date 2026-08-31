/**
 * The front door at opensimlab.com.
 *
 * One screen, in one order: the name, one line, the product running, every
 * specialty as a door you can see the size of, and the facts that answer the
 * objections a stranger has before clicking. Everything else (what it teaches,
 * who it is for, where the pharmacology comes from, what it deliberately does
 * not do) lives one click away at `/about`, which keeps the root domain carrying
 * the descriptive weight without the front door carrying it on screen
 * (platform/landing → One Screen, Every Door).
 *
 * No dash longer than a hyphen is set anywhere a visitor can read it, on this
 * page or in this file. `tests/unit/discoverability.test.ts` asserts the first
 * half on the rendered markup.
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import './landing.css';
import { usePrefersReducedMotion } from '@platform/ui';
import { MODULES } from '@platform/modules/registry';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { HONEST_STATUS } from '@platform/governance/status';
import { FOOTER_LINKS, ONE_LINE_DESCRIPTION, THREE_FACTS } from './content';
import { heroStaticSvg, startLiveHero } from './hero';
import { DEMONSTRATION_HREF } from '@anesthesia/demo/demonstration';

/**
 * Prefetch the anaesthesia entry bundle at low priority after two seconds, so the
 * click feels instant. Skipped entirely when the browser reports a saving-data
 * preference or a slow connection.
 */
function usePrefetchSimulator(): void {
  useEffect(() => {
    const connection = (navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (connection?.saveData === true) return undefined;
    if (connection?.effectiveType && /2g/.test(connection.effectiveType)) return undefined;

    const timer = setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'script';
      link.href = '/anesthesia';
      link.fetchPriority = 'low';
      document.head.append(link);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
}

export function Landing() {
  const reducedMotion = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  usePrefetchSimulator();

  useEffect(() => {
    if (reducedMotion || !canvasRef.current) return undefined;
    return startLiveHero(canvasRef.current);
  }, [reducedMotion]);

  const available = MODULES.filter((module) => module.status === 'available');
  const planned = MODULES.filter((module) => module.status !== 'available');

  return (
    <div className="landing">
      <a className="skip-link" href="#main">Skip to main content</a>
      <main className="landing__front" id="main">
        <h1 className="landing__name">Open Sim Lab</h1>
        <p className="landing__tagline">{ONE_LINE_DESCRIPTION}</p>

        <div className="landing__hero">
          {/* The static rendering is always in the markup, so a crawler, a
              scripting-disabled browser and a reduced-motion visitor all get the
              same trace in the same box. */}
          <div
            className="landing__hero-fallback"
            dangerouslySetInnerHTML={{ __html: heroStaticSvg() }}
          />
          {/* Always present, and transparent until the live hero paints over it.
              Under reduced motion nothing paints and the static trace shows through. */}
          <canvas ref={canvasRef} aria-hidden="true" />
        </div>

        {/* Every module is a door, and every door is the same size.

            This was a run of fifteen 11px pill chips under a single anaesthesia
            button. Two things were wrong with it. It told a visitor the product
            was an anaesthesia simulator with extras, which is not what it is:
            fifteen modules ship at their full planned count and any of them is a
            reasonable place to start. And at that size the chips did not read as
            controls at all, so the one thing a stranger is here to do, pick a
            specialty and start, looked like a row of tags.

            They are tiles now, immediately under the hero, each carrying the
            number of scenarios behind it. The count is the honest version of the
            claim the tagline makes: 240 scenarios is a real number only if a
            visitor can see where they are. */}
        <nav className="landing__modules" aria-label="Specialty modules">
          {available.map((module, index) => (
            <a
              key={module.id}
              className="landing__module-live"
              href={`/${module.route}`}
              /* Its place in the run, so the doors settle in one after another
                 rather than the whole grid appearing at once. The stylesheet owns
                 the timing; this is only the index. */
              style={{ '--tile-index': index } as CSSProperties}
            >
              <span className="landing__module-title">{module.displayName}</span>
              {/* One interpolated string, not `{count} scenarios`. Two adjacent
                  children are two text nodes, and `renderToString` separates
                  those with a `<!-- -->` marker so it can hydrate them, which put
                  `39<!-- --> scenarios` into every prerendered page. It reads
                  correctly either way; there is no reason to ship it. */}
              <span className="landing__module-count">{`${module.scenarioCount} scenarios`}</span>
            </a>
          ))}
        </nav>

        {/* The sixteenth keeps its honest tail: named, not a door, no date. */}
        <p className="landing__module-planned">
          {planned.map((module, index) => (
            <span key={module.id}>
              {index > 0 && ', '}
              <a href={`/${module.route}`}>{module.displayName}</a>
            </span>
          ))}
          {/* A non-breaking space, so the module name and the two words that
              qualify it wrap together rather than breaking across a line. */}
          {'\u00A0planned. No dates.'}
        </p>

        {/* For the visitor who has not decided which door is theirs. It sits
            after the choices rather than before them, because it is the fallback
            and not the offer. */}
        <div className="landing__action">
          <a className="landing__watch" href={DEMONSTRATION_HREF}>
            Watch a 90-second demonstration
          </a>
        </div>

        {/* The three facts, as one quiet line rather than a list of claims. */}
        <p className="landing__facts">
          {THREE_FACTS.map((fact, index) => (
            <span key={fact.short}>
              {index > 0 && <span aria-hidden="true"> · </span>}
              <a href={fact.href}>{fact.short}</a>
            </span>
          ))}
        </p>
      </main>

      <footer className="landing__footer">
        {/* The label is the link. The front door has a hard word budget and this
            claim is the one a visitor is most entitled to interrogate, so the
            route to the evidence is the sentence making the claim rather than
            another line of copy beside it. */}
        <p className="landing__status">
          <a href="/review-status">{HONEST_STATUS.headline}</a>
        </p>
        <ul className="landing__footer-links">
          <li><a href="/about">About</a></li>
          {FOOTER_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} {...(link.href.startsWith('http') ? { rel: 'noreferrer noopener' } : {})}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="landing__disclaimer">{NOT_FOR_CLINICAL_USE}</p>
      </footer>
    </div>
  );
}
