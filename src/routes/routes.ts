/**
 * The route table (platform/delivery → Route Scheme, platform/discoverability).
 *
 * Every indexable route is prerendered to static HTML at build time with its own
 * title, description and canonical URL. Transient session and debrief states carry
 * `noindex`, because they are per-learner and meaningless to a stranger.
 */

import { MODULES } from '@platform/modules/registry';
import { SCENARIOS } from '@anesthesia/scenarios';
import { patientPersonNoun } from '@anesthesia/scenarios/patient-label';
import { EMERGENCY_MEDICINE_SCENARIOS } from '../modules/emergency-medicine/scenarios';

export const SITE_ORIGIN = 'https://opensimlab.com';
export const SITE_NAME = 'Open Sim Lab';

export interface RouteMetadata {
  readonly path: string;
  /** Under 60 characters, unique, ending in the site name. */
  readonly title: string;
  /** Between 110 and 160 characters, specific to this page. */
  readonly description: string;
  readonly indexable: boolean;
  /** Structured data types this route declares. */
  readonly structuredData: readonly ('WebSite' | 'Organization' | 'SoftwareApplication' | 'LearningResource')[];
  /** The heading the prerendered document leads with. */
  readonly heading: string;
}

/**
 * A briefing's description: the patient, the procedure, and what it teaches. Kept
 * between 110 and 160 characters, which the discoverability tests assert.
 */
function scenarioDescription(scenario: (typeof SCENARIOS)[number] | (typeof EMERGENCY_MEDICINE_SCENARIOS)[number]): string {
  const { patient, metadata } = scenario;
  const who = `${patient.ageYears}-year-old ${patientPersonNoun(patient)}`;
  let description = `A ${who} for ${patient.procedure.toLowerCase()}.`;
  // Objectives are added until the description is substantial enough to be worth
  // showing in a result, and stopped before it is truncated. A terse first
  // objective used to leave the whole description under the minimum.
  for (const objective of metadata.objectives) {
    const next = `${description} ${objective.statement.replace(/\.$/, '')}.`;
    if (next.length > 160) {
      // A long first objective must not leave an otherwise useful scenario
      // description below the search-result minimum. The shared return path
      // trims this combined sentence to the same 160-character cap.
      if (description.length < 110) description = next;
      break;
    }
    description = next;
    if (description.length >= 110) break;
  }
  return description.length <= 160 ? description : `${description.slice(0, 157)}...`;
}

/** The one title pattern, used by every route. */
export function formatTitle(subject: string): string {
  return `${subject} · ${SITE_NAME}`;
}

export const ROUTES: readonly RouteMetadata[] = [
  {
    path: '/',
    title: formatTitle('Free clinical simulator'),
    description:
      'A free, browser-based clinical simulator for medical students, residents and nurse '
      + 'anesthetists. No account, works offline, pharmacology with citations.',
    indexable: true,
    structuredData: ['WebSite', 'Organization'],
    heading: 'Open Sim Lab',
  },
  {
    path: '/about',
    title: formatTitle('About'),
    description:
      'What Open Sim Lab teaches and how, who it is for, where its pharmacology comes from, '
      + 'what it deliberately does not do, and how to use it in a course.',
    indexable: true,
    structuredData: [],
    heading: 'About Open Sim Lab',
  },
  {
    path: '/anesthesia',
    title: formatTitle('Anesthesia simulator'),
    description:
      'Induce and maintain general anesthesia on a virtual patient and watch the drugs act on '
      + 'the physiology in real time. Runs in the browser with no account.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Anesthesia simulator',
  },
  // One indexable briefing per scenario, generated from the registry so adding a
  // scenario cannot leave it unroutable or unlisted.
  ...SCENARIOS.map((scenario) => ({
    path: `/anesthesia/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 40
      ? `${scenario.metadata.title.slice(0, 37)}…`
      : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/emergency-medicine',
    title: formatTitle('Emergency medicine simulator'),
    description:
      'Rehearse emergency decisions across shock, breathing crises, stroke, STEMI, unstable rhythms, cardiac arrest, and seizures.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Emergency medicine simulator',
  },
  ...EMERGENCY_MEDICINE_SCENARIOS.map((scenario) => ({
    path: `/emergency-medicine/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 40
      ? `${scenario.metadata.title.slice(0, 37)}…`
      : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/for-educators',
    title: formatTitle('For educators'),
    description:
      'How a nurse anesthesia or medical program can use Open Sim Lab: assignment links, '
      + 'curriculum mapping, reviewing submitted sessions, and self-hosting it.',
    indexable: true,
    structuredData: [],
    heading: 'For educators',
  },
  {
    path: '/curriculum',
    title: formatTitle('Curriculum coverage'),
    description:
      'Which scenarios map to which published training framework domains, what is not yet '
      + 'covered, and the whole mapping as a CSV for program documentation.',
    indexable: true,
    structuredData: [],
    heading: 'Curriculum coverage',
  },
  {
    path: '/review',
    title: formatTitle('Review submitted sessions'),
    description:
      'Open the session files your learners exported. Everything is replayed and computed in '
      + 'your browser; nothing is uploaded anywhere.',
    // A working surface rather than a document worth finding in a search result.
    indexable: false,
    structuredData: [],
    heading: 'Review submitted sessions',
  },
  {
    path: '/content-review',
    title: formatTitle('Review the content'),
    description:
      'For clinicians willing to say what is wrong here: every clinical claim in one list, '
      + 'flag them where you read them, and export your notes as a single file.',
    indexable: true,
    structuredData: [],
    heading: 'Review the clinical content',
  },
  {
    path: '/validation',
    title: formatTitle('Validation report'),
    description:
      'How closely the simulated patient matches the published evidence, benchmark by benchmark, '
      + 'with tolerances and an explicit list of what is not validated.',
    indexable: true,
    structuredData: [],
    heading: 'Validation report',
  },
  {
    path: '/governance',
    title: formatTitle('Clinical governance'),
    description:
      'Who reviews the clinical content, what they have signed, when it is due for re-review, '
      + 'and every item currently outstanding, by name.',
    indexable: true,
    structuredData: [],
    heading: 'Clinical governance',
  },
  {
    path: '/limitations',
    title: formatTitle('Limitations register'),
    description:
      'What this simulator does not model, where its physiology is simplified, and the specific '
      + 'clinical situations in which each simplification would mislead you.',
    indexable: true,
    structuredData: [],
    heading: 'Limitations register',
  },
  {
    path: '/privacy',
    title: formatTitle('Privacy'),
    description:
      'What is stored, where, and what leaves your device. Nothing leaves your device. Each claim '
      + 'on this page maps to a named test that enforces it.',
    indexable: true,
    structuredData: [],
    heading: 'Privacy',
  },
  {
    path: '/gallery',
    title: formatTitle('Component gallery'),
    description:
      'Every component in the design system rendered in every state, for visual review. This page '
      + 'is a development surface rather than a learner-facing one.',
    indexable: false,
    structuredData: [],
    heading: 'Component gallery',
  },
  {
    path: '/frame-budget',
    title: formatTitle('Frame budget harness'),
    description:
      'Measures 95th-percentile frame time while rendering five traces with the solver running, '
      + 'so the budget can be checked on a real device rather than assumed.',
    indexable: false,
    structuredData: [],
    heading: 'Frame budget harness',
  },
  // A planned module route resolves to an honest page rather than an error.
  ...MODULES.filter((module) => module.status === 'planned').map((module) => ({
    path: `/${module.route}`,
    title: formatTitle(`${module.displayName} (planned)`),
    description:
      `The ${module.displayName.toLowerCase()} module is planned and not yet built. This page `
      + 'describes what it will cover and links to the module that is available today.',
    indexable: true,
    structuredData: [] as const,
    heading: `${module.displayName} — planned`,
  })),
];

export function routeFor(path: string): RouteMetadata | undefined {
  return ROUTES.find((route) => route.path === path);
}

export function indexableRoutes(): RouteMetadata[] {
  return ROUTES.filter((route) => route.indexable);
}

export function canonicalUrl(path: string): string {
  return `${SITE_ORIGIN}${path === '/' ? '/' : path.replace(/\/$/, '')}`;
}

/** Social preview generated for one route, shared by prerender and client navigation. */
export function socialImageUrl(path: string): string {
  const name = path === '/' ? 'index' : path.replace(/^\//, '').replace(/\//g, '-');
  return `${SITE_ORIGIN}/og/${name}.svg`;
}
