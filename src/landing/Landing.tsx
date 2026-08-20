/**
 * The front door at opensimlab.com.
 *
 * Two jobs pulling in opposite directions: send the right person into
 * /anesthesia within seconds, and carry all the substantive prose that lets a
 * stranger — or a search engine — understand what this is. It resolves that by
 * being short at the top and substantial below the fold.
 */

import { useEffect, useRef } from 'react';
import './landing.css';
import { Button, usePrefersReducedMotion } from '@platform/ui';
import { MODULES, RELEASE_FEED_URL } from '@platform/modules/registry';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { HONEST_STATUS } from '@platform/governance/status';
import {
  CONTENT_SECTIONS, FOOTER_LINKS, ONE_LINE_DESCRIPTION, QUESTIONS, SUGGESTED_CITATION, THREE_FACTS,
} from './content';
import { heroStaticSvg, startLiveHero } from './hero';

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

  return (
    <div className="landing">
      <a className="skip-link" href="#content">Skip to the description</a>

      {/* Front matter: the name, one line, the hero, one action, three facts,
          and the module directory. No more than two screens at 1440 px. */}
      <header className="landing__front">
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

        <div>
          <Button
            variant="primary"
            onClick={() => { window.location.href = '/anesthesia'; }}
          >
            Open the anesthesia simulator
          </Button>
        </div>

        <ul className="landing__facts">
          {THREE_FACTS.map((fact) => (
            <li key={fact.text}>
              {fact.text}{' '}
              <a href={fact.href}>{fact.linkLabel}</a>
            </li>
          ))}
        </ul>

        <section aria-labelledby="modules-heading">
          <h2 id="modules-heading" className="field__label">Modules</h2>
          <ul className="landing__modules">
            {MODULES.map((module) => (
              <li key={module.id} className="landing__module" data-status={module.status}>
                <div>
                  {module.status === 'available' ? (
                    <a className="landing__module-name" href={`/${module.route}`}>{module.displayName}</a>
                  ) : (
                    <span className="landing__module-name">{module.displayName}</span>
                  )}
                  <p className="landing__module-note">
                    {module.status === 'available' ? module.description : module.plannedScope}
                  </p>
                </div>
                <span className="badge">{module.status === 'available' ? 'Available' : 'Planned'}</span>
              </li>
            ))}
          </ul>
          <p className="landing__module-note">
            No dates are promised for planned modules.{' '}
            <a href={RELEASE_FEED_URL} rel="noreferrer noopener">
              Watch the repository releases to hear when one ships
            </a>
            . No email address is collected.
          </p>
        </section>

        <p className="landing__disclaimer">{HONEST_STATUS.headline} {HONEST_STATUS.detail}</p>
      </header>

      {/* Below the fold: the substantive prose. Not length-limited. */}
      <main className="landing__content" id="content">
        {CONTENT_SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`${section.id}-heading`}>
            <h2 id={`${section.id}-heading`}>{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            {section.list && <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul>}
            {section.link && <p><a href={section.link.href}>{section.link.label}</a></p>}
          </section>
        ))}

        <section aria-labelledby="questions-heading" className="landing__questions">
          <h2 id="questions-heading">Questions</h2>
          <dl>
            {QUESTIONS.map((entry) => (
              <div key={entry.question}>
                <dt>{entry.question}</dt>
                <dd>{entry.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="landing__footer">
        <p className="landing__disclaimer">{NOT_FOR_CLINICAL_USE}</p>
        <ul className="landing__footer-links">
          {FOOTER_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} {...(link.href.startsWith('http') ? { rel: 'noreferrer noopener' } : {})}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="landing__module-note">{SUGGESTED_CITATION}</p>
      </footer>
    </div>
  );
}
