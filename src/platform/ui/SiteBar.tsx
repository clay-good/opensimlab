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

/** The destinations every page offers, in the order they are worth offering. */
export const SITE_BAR_LINKS: readonly SiteBarLink[] = [
  { href: '/anesthesia', label: t('sitebar.anesthesia' as MessageKey) },
  { href: '/emergency-medicine', label: t('sitebar.emergency-medicine' as MessageKey) },
  { href: '/critical-care', label: t('sitebar.critical-care' as MessageKey) },
  { href: '/cardiology', label: t('sitebar.cardiology' as MessageKey) },
  { href: '/respiratory-medicine', label: t('sitebar.respiratory-medicine' as MessageKey) },
  { href: '/pediatrics', label: t('sitebar.pediatrics' as MessageKey) },
  { href: '/neurology', label: t('sitebar.neurology' as MessageKey) },
  { href: '/toxicology', label: t('sitebar.toxicology' as MessageKey) },
  { href: '/obstetrics', label: t('sitebar.obstetrics' as MessageKey) },
  { href: '/neonatology', label: t('sitebar.neonatology' as MessageKey) },
  { href: '/endocrine-metabolic', label: t('sitebar.endocrine-metabolic' as MessageKey) },
  { href: '/renal-electrolyte', label: t('sitebar.renal-electrolyte' as MessageKey) },
  { href: '/infectious-disease', label: t('sitebar.infectious-disease' as MessageKey) },
  { href: '/medical-surgical-nursing', label: t('sitebar.medical-surgical-nursing' as MessageKey) },
  { href: '/oncology', label: t('sitebar.oncology' as MessageKey) },
  { href: '/surgery-trauma', label: t('sitebar.surgery-trauma' as MessageKey) },
  { href: '/about', label: t('sitebar.about' as MessageKey) },
  { href: '/for-educators', label: t('sitebar.for-educators' as MessageKey) },
  { href: '/curriculum', label: t('sitebar.curriculum' as MessageKey) },
  { href: '/validation', label: t('sitebar.validation' as MessageKey) },
  { href: '/governance', label: t('sitebar.governance' as MessageKey) },
  { href: '/limitations', label: t('sitebar.limitations' as MessageKey) },
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
