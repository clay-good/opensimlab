/**
 * schema.org structured data (platform/discoverability → Structured Data That Is
 * Accurate).
 *
 * It describes only what is TRUE. Reviewer names and credentials are drawn from
 * the governance records, so the expertise signals a search engine reads are the
 * same ones a human can audit — and because the board is currently empty, no
 * reviewer is named at all. There are no ratings, no review counts, and no
 * credentials that do not exist.
 */

import { EDITORIAL_BOARD } from '@platform/governance/records';
import { MODULES } from '@platform/modules/registry';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { ONE_LINE_DESCRIPTION } from '@landing/content';
import { SITE_NAME, SITE_ORIGIN, canonicalUrl } from '@routes/routes';

export type JsonLd = Record<string, unknown>;

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    description: ONE_LINE_DESCRIPTION,
    inLanguage: 'en',
    isAccessibleForFree: true,
  };
}

export function organizationJsonLd(): JsonLd {
  const organization: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    description: 'An open-source project building a browser-native clinical simulator.',
  };
  // Only named if the board actually has members. An empty board names nobody.
  if (EDITORIAL_BOARD.length > 0) {
    organization.member = EDITORIAL_BOARD.map((person) => ({
      '@type': 'Person',
      name: person.name,
      honorificSuffix: person.credential,
      affiliation: { '@type': 'Organization', name: person.institution },
    }));
  }
  return organization;
}

export function softwareApplicationJsonLd(): JsonLd {
  const anesthesia = MODULES.find((module) => module.id === 'anesthesia');
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Open Sim Lab Anesthesia',
    url: canonicalUrl('/anesthesia'),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any browser',
    description: anesthesia?.description ?? '',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    inLanguage: 'en',
  };
}

export function learningResourceJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: ROUTINE_INDUCTION.metadata.title,
    url: canonicalUrl(`/anesthesia/scenario/${ROUTINE_INDUCTION.metadata.id}`),
    learningResourceType: 'Simulation',
    educationalLevel: 'Undergraduate medical education, postgraduate year 1',
    teaches: ROUTINE_INDUCTION.metadata.objectives.map((objective) => objective.statement),
    timeRequired: `PT${ROUTINE_INDUCTION.metadata.estimatedMinutes}M`,
    isAccessibleForFree: true,
    inLanguage: 'en',
    license: ROUTINE_INDUCTION.metadata.license,
  };
}

/** The structured data for a route, or an empty list where it declares none. */
export function structuredDataFor(types: readonly string[]): JsonLd[] {
  const out: JsonLd[] = [];
  for (const type of types) {
    if (type === 'WebSite') out.push(websiteJsonLd());
    if (type === 'Organization') out.push(organizationJsonLd());
    if (type === 'SoftwareApplication') out.push(softwareApplicationJsonLd());
    if (type === 'LearningResource') out.push(learningResourceJsonLd());
  }
  return out;
}
