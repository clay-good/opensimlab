/** Lightweight site and document-head metadata shared by the app shell and route catalog. */

import { MODULES } from '@platform/modules/registry';

export const SITE_ORIGIN = 'https://opensimlab.com';
export const SITE_NAME = 'Open Sim Lab';

export interface RouteMetadata {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly indexable: boolean;
  readonly structuredData: readonly ('WebSite' | 'Organization' | 'SoftwareApplication' | 'LearningResource')[];
  readonly heading: string;
}

/** The one title pattern, used by every route. */
export function formatTitle(subject: string): string {
  return `${subject} · ${SITE_NAME}`;
}

export function canonicalUrl(path: string): string {
  return `${SITE_ORIGIN}${path === '/' ? '/' : path.replace(/\/$/, '')}`;
}

/**
 * Social preview generated for one route, shared by prerender and client navigation.
 *
 * PNG, not the SVG it is drawn from. No major crawler or link preview scraper
 * renders SVG, so naming the `.svg` here meant every shared link — and the site
 * has been found almost entirely through shared links — resolved to a card with
 * no image on it.
 */
export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;

export function socialImageUrl(path: string): string {
  const name = path === '/' ? 'index' : path.replace(/^\//, '').replace(/\//g, '-');
  return `${SITE_ORIGIN}/og/${name}.png`;
}

/**
 * The root description, with both of its numbers derived rather than typed.
 *
 * It read `211 free clinical simulation scenarios` for as long as it took nobody
 * to notice that 29 more had shipped, which is the failure mode of writing a
 * count into a string. It also set an em-dash, which the front door does not.
 *
 * It names three specialties and stops. Fifteen will not fit inside the 160
 * characters a search result shows, and they do not need to: every module has its
 * own indexable route with its own description, and so does every one of the
 * scenarios beneath it. The root page's job is the total and the breadth.
 */
const READY_MODULES = MODULES.filter((module) => module.status === 'available');
const READY_SCENARIOS = READY_MODULES.reduce((total, module) => total + module.scenarioCount, 0);

export const ROOT_ROUTE: RouteMetadata = {
  path: '/',
  title: formatTitle('Free clinical simulation practice'),
  description:
    `Practice ${READY_SCENARIOS} free clinical simulation scenarios across `
    + `${READY_MODULES.length} specialties, from anesthesia and emergency medicine to oncology. `
    + 'No account, and it works offline.',
  indexable: true,
  structuredData: ['WebSite', 'Organization'],
  heading: 'Open Sim Lab',
};
