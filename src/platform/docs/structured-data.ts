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
import { getEmergencyMedicineScenario } from '../../modules/emergency-medicine/scenarios';
import { getCriticalCareScenario } from '../../modules/critical-care/scenarios';
import { getCardiologyScenario } from '../../modules/cardiology/scenarios';
import { getRespiratoryMedicineScenario } from '../../modules/respiratory-medicine/scenarios';
import { getPediatricsScenario } from '../../modules/pediatrics/scenarios';
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

export function softwareApplicationJsonLd(path = '/anesthesia'): JsonLd {
  const route = path.replace(/^\//, '').split('/')[0] || 'anesthesia';
  const module = MODULES.find((entry) => entry.route === route)
    ?? MODULES.find((entry) => entry.id === 'anesthesia');
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${SITE_NAME} ${module?.displayName ?? 'Anesthesia'}`,
    url: canonicalUrl(`/${module?.route ?? 'anesthesia'}`),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any browser',
    description: module?.description ?? '',
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
type ScenarioModuleRoute = 'anesthesia' | 'emergency-medicine' | 'critical-care'
  | 'cardiology' | 'respiratory-medicine' | 'pediatrics';

export function learningResourceJsonLd(
  scenarioId: string = DEFAULT_SCENARIO_ID,
  moduleRoute: ScenarioModuleRoute = 'anesthesia',
): JsonLd {
  const scenario = moduleRoute === 'emergency-medicine'
    ? getEmergencyMedicineScenario(scenarioId)
    : moduleRoute === 'critical-care'
      ? getCriticalCareScenario(scenarioId)
      : moduleRoute === 'cardiology'
        ? getCardiologyScenario(scenarioId)
        : moduleRoute === 'respiratory-medicine'
          ? getRespiratoryMedicineScenario(scenarioId)
          : moduleRoute === 'pediatrics'
            ? getPediatricsScenario(scenarioId)
            : getScenario(scenarioId);
  if (!scenario) throw new Error(`No scenario with id ${scenarioId}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: scenario.metadata.title,
    url: canonicalUrl(`/${moduleRoute}/scenario/${scenario.metadata.id}`),
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
  const scenarioMatch = path?.match(
    /^\/(anesthesia|emergency-medicine|critical-care|cardiology|respiratory-medicine|pediatrics)\/scenario\/([^/]+)$/,
  );
  const moduleRoute = scenarioMatch?.[1] as ScenarioModuleRoute | undefined;
  const scenarioId = scenarioMatch?.[2];
  for (const type of types) {
    if (type === 'WebSite') out.push(websiteJsonLd());
    if (type === 'Organization') out.push(organizationJsonLd());
    if (type === 'SoftwareApplication') out.push(softwareApplicationJsonLd(path));
    if (type === 'LearningResource') out.push(learningResourceJsonLd(scenarioId, moduleRoute));
  }
  return out;
}
