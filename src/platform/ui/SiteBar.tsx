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

export interface SiteBarLink {
  readonly href: string;
  readonly label: string;
}

/** The destinations every page offers, in the order they are worth offering. */
export const SITE_BAR_LINKS: readonly SiteBarLink[] = [
  { href: '/anesthesia', label: 'Anesthesia' },
  { href: '/emergency-medicine', label: 'Emergency' },
  { href: '/critical-care', label: 'Critical care' },
  { href: '/cardiology', label: 'Cardiology' },
  { href: '/respiratory-medicine', label: 'Respiratory medicine' },
  { href: '/pediatrics', label: 'Pediatrics' },
  { href: '/neurology', label: 'Neurology' },
  { href: '/toxicology', label: 'Toxicology' },
  { href: '/obstetrics', label: 'Obstetrics' },
  { href: '/neonatology', label: 'Neonatology' },
  { href: '/endocrine-metabolic', label: 'Endocrine + metabolic' },
  { href: '/renal-electrolyte', label: 'Renal + electrolyte' },
  { href: '/infectious-disease', label: 'Infectious disease' },
  { href: '/medical-surgical-nursing', label: 'Nursing' },
  { href: '/about', label: 'About' },
  { href: '/validation', label: 'Validation' },
  { href: '/governance', label: 'Governance' },
  { href: '/limitations', label: 'Limitations' },
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
      <a className="skip-link" href="#main">Skip to main content</a>
      <header className="document__bar">
        <a className="document__home" href="/">Open Sim Lab</a>
        <details className="document__browse" onKeyDown={(event) => {
          if (event.key !== 'Escape' || event.defaultPrevented || !event.currentTarget.open) return;
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.open = false;
          summary.current?.focus({ preventScroll: true });
        }}>
          <summary className="document__browse-toggle" ref={summary}>Browse</summary>
          <nav aria-label="Site">
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
