/**
 * The front door at opensimlab.com.
 *
 * One screen. The name, one line, the product running, one button, and the three
 * facts that answer the only objections a stranger has before clicking. Everything
 * else — what it teaches, who it is for, where the pharmacology comes from, what
 * it deliberately does not do — lives one click away at `/about`, which keeps the
 * root domain carrying the descriptive weight without the front door carrying it
 * on screen (platform/landing → One Screen, One Action).
 */

import { useEffect, useRef } from 'react';
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

        <div className="landing__action">
          <a className="button button--primary" href="/anesthesia">
            Open the anesthesia simulator
          </a>
          {/* The shortest path to the thing this simulator does that a textbook
              cannot. It used to be four clicks from here — front door, module
              index, scenario, briefing — which is three too many for someone
              deciding in ten seconds whether any of this is worth their time. */}
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

        {/* The module directory, compact and unambiguous. Each planned module's
            scope lives on its own route, which is one click from here. */}
        <p className="landing__modules">
          {available.map((module, index) => (
            <span key={module.id}>
              {index > 0 && <span aria-hidden="true"> · </span>}
              <a className="landing__module-live" href={`/${module.route}`}>
                {module.displayName}
              </a>
            </span>
          ))}
          <span className="landing__module-planned">
            {' · '}
            {planned.map((module, index) => (
              <span key={module.id}>
                {index > 0 && ', '}
                <a href={`/${module.route}`}>{module.displayName}</a>
              </span>
            ))}
            {' planned. No dates.'}
          </span>
        </p>
      </main>

      <footer className="landing__footer">
        <p className="landing__status">{HONEST_STATUS.headline}</p>
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
