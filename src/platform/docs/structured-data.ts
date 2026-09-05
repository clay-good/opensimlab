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
import { getNeurologyScenario } from '../../modules/neurology/scenarios';
import { getToxicologyScenario } from '../../modules/toxicology/scenarios';
import { getObstetricsScenario } from '../../modules/obstetrics/scenarios';
import { getNeonatologyScenario } from '../../modules/neonatology/scenarios';
import { getEndocrineMetabolicScenario } from '../../modules/endocrine-metabolic/scenarios';
import { getRenalElectrolyteScenario } from '../../modules/renal-electrolyte/scenarios';
import { getInfectiousDiseaseScenario } from '../../modules/infectious-disease/scenarios';
import { getMedicalSurgicalNursingScenario } from '../../modules/medical-surgical-nursing/scenarios';
import { getOncologyScenario } from '../../modules/oncology/scenarios';
import { ONE_LINE_DESCRIPTION } from '@landing/content';
import { ROUTES, SITE_NAME, SITE_ORIGIN, canonicalUrl } from '@routes/routes';
import { moduleProse } from '@platform/modules/module-prose';

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
    description: module ? moduleProse(module.id).description : '',
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
  | 'cardiology' | 'respiratory-medicine' | 'pediatrics' | 'neurology' | 'toxicology' | 'obstetrics' | 'neonatology' | 'endocrine-metabolic' | 'renal-electrolyte' | 'infectious-disease' | 'medical-surgical-nursing' | 'oncology';

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
          : moduleRoute === 'neonatology'
            ? getNeonatologyScenario(scenarioId)
          : moduleRoute === 'endocrine-metabolic'
            ? getEndocrineMetabolicScenario(scenarioId)
          : moduleRoute === 'renal-electrolyte'
            ? getRenalElectrolyteScenario(scenarioId)
          : moduleRoute === 'infectious-disease'
            ? getInfectiousDiseaseScenario(scenarioId)
          : moduleRoute === 'medical-surgical-nursing'
            ? getMedicalSurgicalNursingScenario(scenarioId)
          : moduleRoute === 'oncology'
            ? getOncologyScenario(scenarioId)
          : moduleRoute === 'pediatrics'
            ? getPediatricsScenario(scenarioId)
            : moduleRoute === 'neurology'
              ? getNeurologyScenario(scenarioId)
              : moduleRoute === 'toxicology'
                ? getToxicologyScenario(scenarioId)
                : moduleRoute === 'obstetrics'
                  ? getObstetricsScenario(scenarioId)
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

/**
 * The trail from the front door to this page.
 *
 * A scenario briefing sits three levels deep — `/` → `/oncology` →
 * `/oncology/scenario/<id>` — and nothing in the markup said so, which left a
 * search result showing the bare URL instead of the path a reader would walk.
 * The hierarchy is real: every briefing is reached from its module's index, and
 * every module from the front door. This only states it.
 *
 * It is emitted for module and scenario routes, and for nothing else: a flat
 * document like `/privacy` has no trail worth describing.
 */
export function breadcrumbJsonLd(path: string): JsonLd | undefined {
  const segments = path.replace(/^\//, '').split('/');
  const module = MODULES.find((entry) => entry.route === segments[0]);
  if (!module) return undefined;

  const trail: { name: string; url: string }[] = [
    { name: SITE_NAME, url: `${SITE_ORIGIN}/` },
    { name: `${module.displayName} simulator`, url: canonicalUrl(`/${module.route}`) },
  ];
  if (segments[1] === 'scenario' && segments[2]) {
    const briefing = ROUTES.find((route) => route.path === path);
    if (!briefing) return undefined;
    trail.push({ name: briefing.heading, url: canonicalUrl(path) });
  } else if (segments.length > 1) {
    // A deeper module path that is not a briefing has no described level.
    return undefined;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: step.url,
    })),
  };
}

/** The structured data for a route, or an empty list where it declares none. */
export function structuredDataFor(types: readonly string[], path?: string): JsonLd[] {
  const out: JsonLd[] = [];
  const scenarioMatch = path?.match(
    /^\/(anesthesia|emergency-medicine|critical-care|cardiology|respiratory-medicine|pediatrics|neurology|toxicology|obstetrics|neonatology|endocrine-metabolic|renal-electrolyte|infectious-disease|medical-surgical-nursing|oncology)\/scenario\/([^/]+)$/,
  );
  const moduleRoute = scenarioMatch?.[1] as ScenarioModuleRoute | undefined;
  const scenarioId = scenarioMatch?.[2];
  for (const type of types) {
    if (type === 'WebSite') out.push(websiteJsonLd());
    if (type === 'Organization') out.push(organizationJsonLd());
    if (type === 'SoftwareApplication') out.push(softwareApplicationJsonLd(path));
    if (type === 'LearningResource') out.push(learningResourceJsonLd(scenarioId, moduleRoute));
  }
  // Appended, so the page's primary entity stays the first record on the page.
  // Emitted from the path rather than declared per route, because the trail is a
  // fact about where a page sits and not an editorial choice a route table makes.
  const breadcrumb = path === undefined ? undefined : breadcrumbJsonLd(path);
  if (breadcrumb) out.push(breadcrumb);
  return out;
}
