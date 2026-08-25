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
import { CRITICAL_CARE_SCENARIOS } from '../modules/critical-care/scenarios';
import { CARDIOLOGY_SCENARIOS } from '../modules/cardiology/scenarios';
import type { Scenario } from '@anesthesia/scenarios/types';
import { ROOT_ROUTE, formatTitle } from './site-metadata';
import type { RouteMetadata } from './site-metadata';
export {
  SITE_NAME, SITE_ORIGIN, canonicalUrl, formatTitle, socialImageUrl,
} from './site-metadata';
export type { RouteMetadata } from './site-metadata';

/**
 * A briefing's description: the patient, the procedure, and what it teaches. Kept
 * between 110 and 160 characters, which the discoverability tests assert.
 */
function scenarioDescription(scenario: Scenario): string {
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

export const ROUTES: readonly RouteMetadata[] = [
  ROOT_ROUTE,
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
      'Rehearse emergency care for shock, breathing, metabolic, electrolyte, overdose, heat, trauma, aortic crises, stroke, rhythms, cardiac arrest, and seizures.',
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
    path: '/critical-care',
    title: formatTitle('Critical care simulator'),
    description: 'Rehearse ICU organ support through serial ventilation, circulation, neurologic, renal, device, escalation, and handoff decisions over time.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Critical care simulator',
  },
  ...CRITICAL_CARE_SCENARIOS.map((scenario) => ({
    path: `/critical-care/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 40
      ? `${scenario.metadata.title.slice(0, 37)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/cardiology',
    title: formatTitle('Cardiology simulator'),
    description: 'Practice coronary care, heart failure, shock, arrhythmias, conduction disorders, pericardial disease, infarction, and hypertensive emergency.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Cardiology simulator',
  },
  ...CARDIOLOGY_SCENARIOS.map((scenario) => ({
    path: `/cardiology/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 40
      ? `${scenario.metadata.title.slice(0, 37)}…` : scenario.metadata.title),
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
      'Private clinical simulation practice with no accounts, analytics, or learner telemetry. '
      + 'Anonymous problem reports are bounded, previewed, and briefly retained.',
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
