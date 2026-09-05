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
import { RESPIRATORY_MEDICINE_SCENARIOS } from '../modules/respiratory-medicine/scenarios';
import { PEDIATRICS_SCENARIOS } from '../modules/pediatrics/scenarios';
import { NEUROLOGY_SCENARIOS } from '../modules/neurology/scenarios';
import { TOXICOLOGY_SCENARIOS } from '../modules/toxicology/scenarios';
import { OBSTETRICS_SCENARIOS } from '../modules/obstetrics/scenarios';
import { NEONATOLOGY_SCENARIOS } from '../modules/neonatology/scenarios';
import { ENDOCRINE_METABOLIC_SCENARIOS } from '../modules/endocrine-metabolic/scenarios';
import { RENAL_ELECTROLYTE_SCENARIOS } from '../modules/renal-electrolyte/scenarios';
import { INFECTIOUS_DISEASE_SCENARIOS } from '../modules/infectious-disease/scenarios';
import { MEDICAL_SURGICAL_NURSING_SCENARIOS } from '../modules/medical-surgical-nursing/scenarios';
import { ONCOLOGY_SCENARIOS } from '../modules/oncology/scenarios';
import type { Scenario } from '@anesthesia/scenarios/types';
import { ROOT_ROUTE, formatTitle } from './site-metadata';
import type { RouteMetadata } from './site-metadata';
export {
  SITE_NAME, SITE_ORIGIN, SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_WIDTH,
  canonicalUrl, formatTitle, socialImageAlt, socialImageUrl,
} from './site-metadata';
export type { RouteMetadata } from './site-metadata';

/**
 * A briefing's description: the patient, the procedure, and what it teaches. Kept
 * between 110 and 160 characters, which the discoverability tests assert.
 */
function scenarioDescription(scenario: Scenario): string {
  const { patient, metadata } = scenario;
  const who = patient.ageYears === 0 ? 'newborn' : `${patient.ageYears}-year-old ${patientPersonNoun(patient)}`;
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
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…`
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
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…`
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
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/cardiology',
    title: formatTitle('Cardiology simulator'),
    description: 'Practice coronary care, heart failure, shock, arrhythmias, conduction and external pacing, pericardial disease, infarction, and hypertensive emergency.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Cardiology simulator',
  },
  ...CARDIOLOGY_SCENARIOS.map((scenario) => ({
    path: `/cardiology/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/respiratory-medicine',
    title: formatTitle('Respiratory medicine simulator'),
    description: 'Practice calm respiratory medicine labs for acute breathing failure, recovery, pleural disease, airway clearance, and sleep-related hypoventilation.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Respiratory medicine simulator',
  },
  ...RESPIRATORY_MEDICINE_SCENARIOS.map((scenario) => ({
    path: `/respiratory-medicine/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/pediatrics',
    title: formatTitle('Pediatrics simulator'),
    description: 'Practice calm whole-child recognition, serial reassessment, escalation, and protected handoff across pediatric emergencies, resuscitation, and safeguarding.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Pediatrics simulator',
  },
  ...PEDIATRICS_SCENARIOS.map((scenario) => ({
    path: `/pediatrics/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/neurology',
    title: formatTitle('Neurology simulator'),
    description: 'Practice calm stroke, hemorrhage, seizure, and neurological deterioration recognition, serial reassessment, qualified escalation, and handoff.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Neurology simulator',
  },
  ...NEUROLOGY_SCENARIOS.map((scenario) => ({
    path: `/neurology/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/toxicology',
    title: formatTitle('Toxicology simulator'),
    description: 'Practice calm recognition, support, antidote boundaries, serial reassessment, and handoff across high-risk poisoning and toxic exposure scenarios.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Toxicology simulator',
  },
  ...TOXICOLOGY_SCENARIOS.map((scenario) => ({
    path: `/toxicology/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/obstetrics',
    title: formatTitle('Obstetrics simulator'),
    description: 'Practice calm recognition, coordinated response, serial reassessment, and handoff across delivery-room and postpartum obstetric emergencies.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Obstetrics simulator',
  },
  ...OBSTETRICS_SCENARIOS.map((scenario) => ({
    path: `/obstetrics/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/neonatology',
    title: formatTitle('Neonatology simulator'),
    description: 'Practice calm newborn transition, ventilation, thermal care, glucose, infection, escalation, reassessment, and parent-newborn handoff.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Neonatology simulator',
  },
  ...NEONATOLOGY_SCENARIOS.map((scenario) => ({
    path: `/neonatology/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/endocrine-metabolic',
    title: formatTitle('Endocrine and metabolic medicine simulator'),
    description: 'Practice calm metabolic trajectory review, treatment boundaries, transition readiness, and recurrence-aware handoff across endocrine emergencies.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Endocrine and metabolic medicine simulator',
  },
  ...ENDOCRINE_METABOLIC_SCENARIOS.map((scenario) => ({
    path: `/endocrine-metabolic/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/renal-electrolyte',
    title: formatTitle('Renal and electrolyte medicine simulator'),
    description: 'Practice calm kidney and electrolyte reassessment, immediate protection, treatment boundaries, and recurrence-aware handoff in focused simulations.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Renal and electrolyte medicine simulator',
  },
  ...RENAL_ELECTROLYTE_SCENARIOS.map((scenario) => ({
    path: `/renal-electrolyte/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/infectious-disease',
    title: formatTitle('Infectious disease simulator'),
    description: 'Practice calm recognition of dangerous infection, timely activation, antimicrobial and fluid boundaries, serial reassessment, and honest handoff.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Infectious disease simulator',
  },
  ...INFECTIOUS_DISEASE_SCENARIOS.map((scenario) => ({
    path: `/infectious-disease/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/medical-surgical-nursing',
    title: formatTitle('Nursing simulator'),
    description: 'Practice ward recognition when the early-warning score stays low, escalation when the system resists, and handoff of a concern left unresolved.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Nursing simulator',
  },
  ...MEDICAL_SURGICAL_NURSING_SCENARIOS.map((scenario) => ({
    path: `/medical-surgical-nursing/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
    description: scenarioDescription(scenario),
    indexable: true,
    structuredData: ['LearningResource'] as const,
    heading: scenario.metadata.title,
  })),
  {
    path: '/oncology',
    title: formatTitle('Oncology simulator'),
    description: 'Practice recognising a cancer-treatment exposure that has already stopped, a complication that arrives late, and returning the problem to the treating service.',
    indexable: true,
    structuredData: ['SoftwareApplication'],
    heading: 'Oncology simulator',
  },
  ...ONCOLOGY_SCENARIOS.map((scenario) => ({
    path: `/oncology/scenario/${scenario.metadata.id}`,
    title: formatTitle(scenario.metadata.title.length > 44
      ? `${scenario.metadata.title.slice(0, 41)}…` : scenario.metadata.title),
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
    path: '/review-status',
    title: formatTitle('Review status'),
    description:
      'Every content item in this build, the maturity status it carries, and the label shown '
      + 'beside it, plus the editorial board state. No count without its list.',
    indexable: true,
    structuredData: [],
    heading: 'Review status',
  },
  {
    path: '/corrections',
    title: formatTitle('Corrections log'),
    description:
      'The permanent public record of every clinical error found in Open Sim Lab, what it could '
      + 'have taught, what changed, and which build carried the fix.',
    indexable: true,
    structuredData: [],
    heading: 'Corrections log',
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
      'Private clinical simulation practice with no accounts, analytics, or telemetry. Anonymous '
      + 'problem reports are previewed and retained for at most 30 days.',
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
