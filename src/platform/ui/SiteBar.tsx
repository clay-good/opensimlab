/**
 * The one bar that says where you are and gets you out.
 *
 * The scenario index and the scenario briefing had no navigation at all —
 * between them, five links, every one of them deeper into a scenario. A visitor
 * who followed a shared link to a briefing could start the scenario or close the
 * tab. They could not reach the scenario list, the validation report, the
 * governance page, or the front door.
 *
 * The trust documents already had a bar. Rather than a second one that could
 * drift from it, this is that bar, extracted, so every non-cockpit surface
 * carries the same navigation. The cockpit keeps its own status bar: it is a
 * full-screen instrument and a site header on top of it would be chrome over a
 * monitor.
 */

import { useRef } from 'react';
import { t, type MessageKey } from '@platform/i18n/messages';

export interface SiteBarLink {
  readonly href: string;
  readonly label: string;
}

/** A link whose label is read from the catalog when it is shown, not when this module loads. */
const link = (href: string, key: string): SiteBarLink => ({ href, get label() { return t(key as MessageKey); } });

/** The destinations every page offers, in the order they are worth offering. */
export const SITE_BAR_LINKS: readonly SiteBarLink[] = [
  link('/anesthesia', 'sitebar.anesthesia'),
  link('/emergency-medicine', 'sitebar.emergency-medicine'),
  link('/critical-care', 'sitebar.critical-care'),
  link('/cardiology', 'sitebar.cardiology'),
  link('/respiratory-medicine', 'sitebar.respiratory-medicine'),
  link('/pediatrics', 'sitebar.pediatrics'),
  link('/neurology', 'sitebar.neurology'),
  link('/toxicology', 'sitebar.toxicology'),
  link('/obstetrics', 'sitebar.obstetrics'),
  link('/neonatology', 'sitebar.neonatology'),
  link('/endocrine-metabolic', 'sitebar.endocrine-metabolic'),
  link('/renal-electrolyte', 'sitebar.renal-electrolyte'),
  link('/infectious-disease', 'sitebar.infectious-disease'),
  link('/medical-surgical-nursing', 'sitebar.medical-surgical-nursing'),
  link('/oncology', 'sitebar.oncology'),
  link('/surgery-trauma', 'sitebar.surgery-trauma'),
  link('/about', 'sitebar.about'),
  link('/for-educators', 'sitebar.for-educators'),
  link('/curriculum', 'sitebar.curriculum'),
  link('/validation', 'sitebar.validation'),
  link('/governance', 'sitebar.governance'),
  link('/limitations', 'sitebar.limitations'),
];

export interface SiteBarProps {
  /** The current path, so the page you are on is marked rather than offered. */
  readonly current?: string;
  /** Extra destinations for a surface that has its own, appended after these. */
  readonly extra?: readonly SiteBarLink[];
}

export function SiteBar({ current, extra = [] }: SiteBarProps) {
  const summary = useRef<HTMLElement>(null);
  const links = [
    ...SITE_BAR_LINKS,
    ...extra.filter((candidate) => !SITE_BAR_LINKS.some((shared) => shared.href === candidate.href)),
  ];
  return (
    <>
      <a className="skip-link" href="#main">{t('sitebar.skip')}</a>
      <header className="document__bar">
        <a className="document__home" href="/">{t('sitebar.home')}</a>
        <details className="document__browse" onKeyDown={(event) => {
          if (event.key !== 'Escape' || event.defaultPrevented || !event.currentTarget.open) return;
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.open = false;
          summary.current?.focus({ preventScroll: true });
        }}>
          <summary className="document__browse-toggle" ref={summary}>{t('sitebar.browse')}</summary>
          <nav aria-label={t('sitebar.nav-label')}>
            <ul className="document__nav">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    {...(link.href === current ? { 'aria-current': 'page' } : {})}
                    {...(link.href.startsWith('http') ? { rel: 'noreferrer noopener' } : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </header>
    </>
  );
}
