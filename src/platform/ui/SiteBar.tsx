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

export interface SiteBarLink {
  readonly href: string;
  readonly label: string;
}

/** The destinations every page offers, in the order they are worth offering. */
export const SITE_BAR_LINKS: readonly SiteBarLink[] = [
  { href: '/anesthesia', label: 'Anesthesia' },
  { href: '/emergency-medicine', label: 'Emergency' },
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
  const links = [
    ...SITE_BAR_LINKS,
    ...extra.filter((candidate) => !SITE_BAR_LINKS.some((shared) => shared.href === candidate.href)),
  ];
  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <header className="document__bar">
        <a className="document__home" href="/">Open Sim Lab</a>
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
      </header>
    </>
  );
}
