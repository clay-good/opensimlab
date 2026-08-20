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
import { DEFAULT_SCENARIO_ID, getScenario } from '@anesthesia/scenarios';
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

/**
 * The structured data for ONE scenario briefing. It takes the scenario id,
 * because emitting the same description on every briefing route would be a claim
 * the site does not make.
 */
export function learningResourceJsonLd(scenarioId: string = DEFAULT_SCENARIO_ID): JsonLd {
  const scenario = getScenario(scenarioId) ?? getScenario(DEFAULT_SCENARIO_ID);
  if (!scenario) throw new Error(`No scenario with id ${scenarioId}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: scenario.metadata.title,
    url: canonicalUrl(`/anesthesia/scenario/${scenario.metadata.id}`),
    learningResourceType: 'Simulation',
    educationalLevel: 'Undergraduate medical education, postgraduate year 1',
    teaches: scenario.metadata.objectives.map((objective) => objective.statement),
    timeRequired: `PT${scenario.metadata.estimatedMinutes}M`,
    isAccessibleForFree: true,
    inLanguage: 'en',
    license: scenario.metadata.license,
  };
}

/** The structured data for a route, or an empty list where it declares none. */
export function structuredDataFor(types: readonly string[], path?: string): JsonLd[] {
  const out: JsonLd[] = [];
  const scenarioId = path?.startsWith('/anesthesia/scenario/')
    ? path.slice('/anesthesia/scenario/'.length)
    : undefined;
  for (const type of types) {
    if (type === 'WebSite') out.push(websiteJsonLd());
    if (type === 'Organization') out.push(organizationJsonLd());
    if (type === 'SoftwareApplication') out.push(softwareApplicationJsonLd());
    if (type === 'LearningResource') out.push(learningResourceJsonLd(scenarioId));
  }
  return out;
}
