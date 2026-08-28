/** Lightweight site and document-head metadata shared by the app shell and route catalog. */

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

/** Social preview generated for one route, shared by prerender and client navigation. */
export function socialImageUrl(path: string): string {
  const name = path === '/' ? 'index' : path.replace(/^\//, '').replace(/\//g, '-');
  return `${SITE_ORIGIN}/og/${name}.svg`;
}

export const ROOT_ROUTE: RouteMetadata = {
  path: '/',
  title: formatTitle('Free clinical simulation practice'),
  description:
    'Practice 211 free clinical simulation scenarios across anesthesia, emergency medicine, '
    + 'cardiology, infectious disease, and more—no account required.',
  indexable: true,
  structuredData: ['WebSite', 'Organization'],
  heading: 'Open Sim Lab',
};
