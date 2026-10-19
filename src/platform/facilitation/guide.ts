/**
 * The facilitator guide is a view of scenario fields, not a document
 * (learning/facilitation → facilitator guide).
 *
 * Every line below comes from a field the scenario already declares, in the
 * order the INACSL Healthcare Simulation Standards of Best Practice (2021) give
 * simulation design, prebriefing and debriefing. The only prose this module
 * owns is the fixed templates in `GUIDE_TEMPLATES`, and a test holds them free
 * of clinical claims. A section whose field is missing renders as absent, with
 * the reason, so a guide can never read as more complete than its scenario.
 */
import type { Scenario } from '@anesthesia/scenarios/types';
import { MATURITY_LABELS } from '@platform/governance/publication';
import type { FacilitatedScenario } from './scenario-catalog';

export interface GuideItem {
  readonly label?: string;
  readonly text: string;
}

export type GuideSection =
  | { readonly id: string; readonly heading: string; readonly status: 'present'; readonly items: readonly GuideItem[] }
  | { readonly id: string; readonly heading: string; readonly status: 'absent'; readonly reason: string };

/** The only prose the guide adds. No dose, value, diagnosis, or recommendation may appear here. */
export const GUIDE_TEMPLATES = {
  fiction:
    'The patient, the setting, and every number are fictional. Ask learners to engage with the '
    + 'scenario as if it were real for its length, and say plainly that the simulator is a teaching model with stated '
    + 'limits, not a patient.',
  confidentiality:
    'Agree before starting that what learners do and say in the session stays in the room, and '
    + 'that mistakes made here are the material the debrief works with, not a judgment of anyone.',
  monitoring: 'The monitor and controls available in this scenario:',
  reactions: 'Reactions: How are you feeling after that? What stood out to you?',
  description: 'Description: In a sentence or two, what was going on, and what were you dealing with?',
  analysisLead: 'Analysis, one prompt per objective, from the scenario\'s own debrief rubric:',
  summary: 'Summary: What will you take from this into your next case? What would you do the same, and differently?',
  timelineLead: 'Ticks are simulation steps from the start of the session; a condition fires when it first holds.',
  unsigned: 'No credentialed clinician has signed this scenario. It is published as a preview.',
  report: 'Report a problem with the report control inside the scenario; the triage process is on /corrections.',
} as const;

const UNSIGNED = 'UNSIGNED';

const absent = (id: string, heading: string, reason: string): GuideSection =>
  ({ id, heading, status: 'absent', reason });

const present = (id: string, heading: string, items: readonly GuideItem[], reason: string): GuideSection =>
  items.length === 0 ? absent(id, heading, reason) : { id, heading, status: 'present', items };

function patientItems(scenario: Scenario): GuideItem[] {
  const { patient } = scenario;
  const list = (values: readonly string[] | undefined) => values?.length ? values.join('; ') : null;
  const items: (GuideItem | null)[] = [
    { label: 'Profile', text: `${patient.ageYears} years, ${patient.sex}, ${patient.weightKg} kg, ${patient.heightCm} cm` },
    { label: 'Working problem', text: patient.diagnosis },
    { label: 'Setting or procedure', text: patient.procedure },
    list(patient.comorbidities) === null ? null : { label: 'History', text: list(patient.comorbidities)! },
    list(patient.medications) === null ? null : { label: 'Medications', text: list(patient.medications)! },
    list(patient.allergies) === null ? null : { label: 'Allergies', text: list(patient.allergies)! },
    patient.fasting === undefined ? null : { label: 'Fasting', text: patient.fasting },
    patient.airway.assessment === undefined ? null : { label: 'Airway', text: patient.airway.assessment },
  ];
  return items.filter((item): item is GuideItem => item !== null);
}

function timelineItems(scenario: Scenario): GuideItem[] {
  return scenario.timeline.map((event) => {
    const at = event.atTick !== undefined
      ? (event.atTick === 0 ? 'At start' : `Tick ${event.atTick}`)
      : event.when !== undefined ? `When ${event.when}` : 'Unscheduled';
    const what = event.message ?? `${event.type}${event.target === undefined ? '' : `: ${event.target}`}`;
    return { label: at, text: what };
  });
}

function debriefItems(scenario: Scenario): GuideItem[] {
  const statement = new Map(scenario.metadata.objectives.map((objective) => [objective.id, objective.statement]));
  const analysis = scenario.debrief.rubric.map((item) => ({
    label: statement.get(item.objectiveId) ?? item.objectiveId,
    text: item.question,
  }));
  if (analysis.length === 0) return [];
  return [
    { text: GUIDE_TEMPLATES.reactions },
    { text: GUIDE_TEMPLATES.description },
    { text: GUIDE_TEMPLATES.analysisLead },
    ...analysis,
    { text: GUIDE_TEMPLATES.summary },
  ];
}

/** Every section, in the order the design fixes, present or absent with its reason. */
export function facilitatorGuide({ moduleName, scenario }: FacilitatedScenario): readonly GuideSection[] {
  const { metadata } = scenario;
  const signed = metadata.clinicalReview.reviewer !== UNSIGNED;
  return [
    present('at-a-glance', 'At a glance', [
      { label: 'Module', text: moduleName },
      { label: 'Duration', text: `About ${metadata.estimatedMinutes} minutes` },
      { label: 'Difficulty', text: metadata.difficulty },
      { label: 'Published as', text: MATURITY_LABELS[metadata.maturity] },
    ], 'The scenario declares no metadata.'),
    present('objectives', 'Learning objectives',
      metadata.objectives.map((objective) => ({ label: objective.statement, text: objective.measure })),
      'The scenario declares no objectives.'),
    absent('frameworks', 'Framework mapping',
      'The guide does not read curriculum mappings yet. Mapped frameworks are listed on /curriculum.'),
    present('patient', 'Patient', patientItems(scenario), 'The scenario declares no patient.'),
    present('prebrief', 'Prebrief', [
      { text: GUIDE_TEMPLATES.fiction },
      { text: GUIDE_TEMPLATES.confidentiality },
      { label: GUIDE_TEMPLATES.monitoring, text: scenario.equipment.monitoring.join(', ') || 'none declared' },
    ], 'No prebrief could be built.'),
    present('timeline', 'Timeline', scenario.timeline.length === 0 ? []
      : [{ text: GUIDE_TEMPLATES.timelineLead }, ...timelineItems(scenario)],
    'The scenario declares no timeline events.'),
    absent('expected-actions', 'Expected actions',
      'Accepted actions, windows, and order are not yet read from the expert transcript.'),
    absent('error-and-recovery', 'Common error and recovery',
      'The common-error and recovery transcripts are not yet summarized here.'),
    present('debrief', 'Debrief prompts (PEARLS)', debriefItems(scenario),
      'The scenario declares no debrief rubric.'),
    absent('pause-points', 'Pause points and bookmarks',
      'The scenario format does not declare pause points or bookmarks yet.'),
    present('limitations', 'Limitations',
      (metadata.limitations ?? []).map((text) => ({ text })),
      'The scenario declares no limitations of its own; module limitations are on /limitations.'),
    present('sources', 'Sources',
      metadata.clinicalReview.sources.map((text) => ({ text })),
      'The scenario declares no sources.'),
    present('provenance', 'Provenance', [
      { label: 'Scenario', text: `${metadata.id}, content version ${metadata.version}` },
      { label: 'Licence', text: metadata.license },
      { label: 'Author', text: metadata.author },
      { label: 'Review', text: signed
        ? `${metadata.clinicalReview.reviewer}, ${metadata.clinicalReview.credential}, reviewed ${metadata.clinicalReview.reviewedOn}`
        : GUIDE_TEMPLATES.unsigned },
      { label: 'Problems', text: GUIDE_TEMPLATES.report },
    ], 'No provenance could be built.'),
  ];
}

/** The sections a scenario's guide shows as absent, for the catalog gate report. */
export function absentGuideSections(entry: FacilitatedScenario): readonly string[] {
  return facilitatorGuide(entry).filter((section) => section.status === 'absent')
    .map((section) => section.id);
}
